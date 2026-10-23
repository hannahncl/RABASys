const express = require("express");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { logAudit } = require("../utils/auditLogger");

const router = express.Router();

const reviewSelect = `
    SELECT 
        r.review_id,
        r.account_id,
        r.package_id,
        r.vehicle_id,
        r.booking_id,
        r.rental_booking_id,
        r.rating,
        r.comment,
        r.image_url,
        r.created_at,
        r.updated_at,
        a.first_name,
        a.last_name,
        TRIM(CONCAT(a.first_name, ' ', a.last_name)) AS customer_name,
        a.email AS customer_email,
        p.package_name,
        v.vehicle_name,
        CASE 
            WHEN r.vehicle_id IS NOT NULL OR r.rental_booking_id IS NOT NULL THEN 'Car Rental' 
            ELSE 'Tour Package' 
        END AS service_type,
        COALESCE(p.package_name, v.vehicle_name, 'General Service') AS service_name
    FROM review r
    JOIN account a ON r.account_id = a.account_id
    LEFT JOIN tour_package p ON r.package_id = p.package_id
    LEFT JOIN vehicle v ON r.vehicle_id = v.vehicle_id
`;

router.get("/", async (req, res, next) => {
    try {
        const { package_id, vehicle_id, booking_id, rental_booking_id, account_id } = req.query;
        const conditions = ["r.deleted_at IS NULL"];
        const params = [];

        if (package_id) {
            params.push(package_id);
            conditions.push(`r.package_id = $${params.length}`);
        }
        if (vehicle_id) {
            params.push(vehicle_id);
            conditions.push(`r.vehicle_id = $${params.length}`);
        }
        if (booking_id) {
            params.push(booking_id);
            conditions.push(`r.booking_id = $${params.length}`);
        }
        if (rental_booking_id) {
            params.push(rental_booking_id);
            conditions.push(`r.rental_booking_id = $${params.length}`);
        }
        if (account_id) {
            params.push(account_id);
            conditions.push(`r.account_id = $${params.length}`);
        }

        const query = `${reviewSelect} WHERE ${conditions.join(" AND ")} ORDER BY r.created_at DESC`;
        const { rows: reviews } = await db.query(query, params);
        res.json(reviews);
    } catch (error) {
        next(error);
    }
});

router.post("/", requireAuth, async (req, res, next) => {
    try {
        const { booking_id, rental_booking_id, rating, comment, image_url } = req.body;
        const numericRating = Number(rating);
        const reviewImage = image_url ? String(image_url) : null;

        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(422).json({ message: "Rating must be between 1 and 5." });
        }
        if (reviewImage && (!reviewImage.startsWith("data:image/") || reviewImage.length > 60000)) {
            return res.status(422).json({ message: "The review photo must be a valid image smaller than 60 KB." });
        }

        let isRental = false;
        let matchedTourBooking = null;
        let matchedRentalBooking = null;

        if (rental_booking_id) {
            const { rows: rentals } = await db.query(
                "SELECT rental_booking_id, account_id, vehicle_id, booking_status FROM car_rental_booking WHERE rental_booking_id = $1 AND deleted_at IS NULL",
                [rental_booking_id]
            );
            matchedRentalBooking = rentals[0];
            if (!matchedRentalBooking) return res.status(404).json({ message: "Car rental booking not found." });
            isRental = true;
        } else if (booking_id) {
            // First check tour booking
            const { rows: tours } = await db.query(
                "SELECT booking_id, account_id, package_id, booking_status FROM booking WHERE booking_id = $1 AND deleted_at IS NULL",
                [booking_id]
            );
            if (tours.length > 0) {
                matchedTourBooking = tours[0];
            } else {
                // Check if it's a car rental booking ID
                const { rows: rentals } = await db.query(
                    "SELECT rental_booking_id, account_id, vehicle_id, booking_status FROM car_rental_booking WHERE rental_booking_id = $1 AND deleted_at IS NULL",
                    [booking_id]
                );
                if (rentals.length > 0) {
                    matchedRentalBooking = rentals[0];
                    isRental = true;
                }
            }
        }

        if (!matchedTourBooking && !matchedRentalBooking) {
            return res.status(404).json({ message: "Booking record not found." });
        }

        // Ownership check
        if (req.user.role === "Customer") {
            const ownerId = isRental ? matchedRentalBooking.account_id : matchedTourBooking.account_id;
            if (ownerId !== req.user.accountId) {
                return res.status(403).json({ message: "You can only review your own booking." });
            }
        }

        // Duplicate check
        if (isRental) {
            const { rows: existing } = await db.query(
                "SELECT review_id FROM review WHERE rental_booking_id = $1 AND deleted_at IS NULL",
                [matchedRentalBooking.rental_booking_id]
            );
            if (existing.length > 0) {
                return res.status(409).json({ message: "You have already reviewed this car rental booking." });
            }

            const { rows: inserted } = await db.query(
                "INSERT INTO review (account_id, vehicle_id, rental_booking_id, rating, comment, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING review_id",
                [req.user.accountId, matchedRentalBooking.vehicle_id, matchedRentalBooking.rental_booking_id, numericRating, comment || null, reviewImage]
            );

            const { rows } = await db.query(`${reviewSelect} WHERE r.review_id = $1`, [inserted[0].review_id]);
            await logAudit({
                accountId: req.user.accountId,
                sessionId: req.user.sessionId,
                action: "CREATE",
                tableName: "review",
                recordId: inserted[0].review_id,
                newValues: rows[0],
                req
            });
            return res.status(201).json(rows[0]);
        } else {
            const { rows: existing } = await db.query(
                "SELECT review_id FROM review WHERE booking_id = $1 AND deleted_at IS NULL",
                [matchedTourBooking.booking_id]
            );
            if (existing.length > 0) {
                return res.status(409).json({ message: "You have already reviewed this booking." });
            }

            const { rows: inserted } = await db.query(
                "INSERT INTO review (account_id, package_id, booking_id, rating, comment, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING review_id",
                [req.user.accountId, matchedTourBooking.package_id, matchedTourBooking.booking_id, numericRating, comment || null, reviewImage]
            );

            const { rows } = await db.query(`${reviewSelect} WHERE r.review_id = $1`, [inserted[0].review_id]);
            await logAudit({
                accountId: req.user.accountId,
                sessionId: req.user.sessionId,
                action: "CREATE",
                tableName: "review",
                recordId: inserted[0].review_id,
                newValues: rows[0],
                req
            });
            return res.status(201).json(rows[0]);
        }
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const { rows: existing } = await db.query("SELECT * FROM review WHERE review_id = $1 AND deleted_at IS NULL", [req.params.id]);
        if (!existing[0]) return res.status(404).json({ message: "Review not found." });

        await db.query("UPDATE review SET deleted_at = NOW() WHERE review_id = $1", [req.params.id]);
        await logAudit({
            accountId: req.user.accountId,
            sessionId: req.user.sessionId,
            action: "DELETE",
            tableName: "review",
            recordId: Number(req.params.id),
            oldValues: existing[0],
            req
        });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
