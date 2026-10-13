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
            conditions.push("r.package_id = ?");
            params.push(package_id);
        }
        if (vehicle_id) {
            conditions.push("r.vehicle_id = ?");
            params.push(vehicle_id);
        }
        if (booking_id) {
            conditions.push("r.booking_id = ?");
            params.push(booking_id);
        }
        if (rental_booking_id) {
            conditions.push("r.rental_booking_id = ?");
            params.push(rental_booking_id);
        }
        if (account_id) {
            conditions.push("r.account_id = ?");
            params.push(account_id);
        }

        const query = `${reviewSelect} WHERE ${conditions.join(" AND ")} ORDER BY r.created_at DESC`;
        const [reviews] = await db.execute(query, params);
        res.json(reviews);
    } catch (error) {
        next(error);
    }
});

router.post("/", requireAuth, async (req, res, next) => {
    try {
        const { booking_id, rental_booking_id, rating, comment } = req.body;
        const numericRating = Number(rating);

        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(422).json({ message: "Rating must be between 1 and 5." });
        }

        let isRental = false;
        let matchedTourBooking = null;
        let matchedRentalBooking = null;

        if (rental_booking_id) {
            const [rentals] = await db.execute(
                "SELECT rental_booking_id, account_id, vehicle_id, booking_status FROM car_rental_booking WHERE rental_booking_id = ? AND deleted_at IS NULL",
                [rental_booking_id]
            );
            matchedRentalBooking = rentals[0];
            if (!matchedRentalBooking) return res.status(404).json({ message: "Car rental booking not found." });
            isRental = true;
        } else if (booking_id) {
            // First check tour booking
            const [tours] = await db.execute(
                "SELECT booking_id, account_id, package_id, booking_status FROM booking WHERE booking_id = ? AND deleted_at IS NULL",
                [booking_id]
            );
            if (tours.length > 0) {
                matchedTourBooking = tours[0];
            } else {
                // Check if it's a car rental booking ID
                const [rentals] = await db.execute(
                    "SELECT rental_booking_id, account_id, vehicle_id, booking_status FROM car_rental_booking WHERE rental_booking_id = ? AND deleted_at IS NULL",
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
            const [existing] = await db.execute(
                "SELECT review_id FROM review WHERE rental_booking_id = ? AND deleted_at IS NULL",
                [matchedRentalBooking.rental_booking_id]
            );
            if (existing.length > 0) {
                return res.status(409).json({ message: "You have already reviewed this car rental booking." });
            }

            const [result] = await db.execute(
                "INSERT INTO review (account_id, vehicle_id, rental_booking_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
                [req.user.accountId, matchedRentalBooking.vehicle_id, matchedRentalBooking.rental_booking_id, numericRating, comment || null]
            );

            const [rows] = await db.execute(`${reviewSelect} WHERE r.review_id = ?`, [result.insertId]);
            await logAudit({
                accountId: req.user.accountId,
                sessionId: req.user.sessionId,
                action: "CREATE",
                tableName: "review",
                recordId: result.insertId,
                newValues: rows[0],
                req
            });
            return res.status(201).json(rows[0]);
        } else {
            const [existing] = await db.execute(
                "SELECT review_id FROM review WHERE booking_id = ? AND deleted_at IS NULL",
                [matchedTourBooking.booking_id]
            );
            if (existing.length > 0) {
                return res.status(409).json({ message: "You have already reviewed this booking." });
            }

            const [result] = await db.execute(
                "INSERT INTO review (account_id, package_id, booking_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
                [req.user.accountId, matchedTourBooking.package_id, matchedTourBooking.booking_id, numericRating, comment || null]
            );

            const [rows] = await db.execute(`${reviewSelect} WHERE r.review_id = ?`, [result.insertId]);
            await logAudit({
                accountId: req.user.accountId,
                sessionId: req.user.sessionId,
                action: "CREATE",
                tableName: "review",
                recordId: result.insertId,
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
        const [existing] = await db.execute("SELECT * FROM review WHERE review_id = ? AND deleted_at IS NULL", [req.params.id]);
        if (!existing[0]) return res.status(404).json({ message: "Review not found." });

        await db.execute("UPDATE review SET deleted_at = NOW() WHERE review_id = ?", [req.params.id]);
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
