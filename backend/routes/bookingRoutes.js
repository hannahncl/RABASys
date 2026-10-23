const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { logAudit } = require("../utils/auditLogger");
const { sendBookingConfirmation } = require("../config/mailer");
const router = express.Router();


const bookingSelect = `SELECT b.*,
    COALESCE(p.package_name, CONCAT('Customized Trip: ', b.customized_details->>'destination')) AS package_name,
    COALESCE(p.destination, b.customized_details->>'destination') AS destination,
    COALESCE(p.package_type, CASE WHEN b.customized_details IS NOT NULL THEN 'customization' ELSE NULL END) AS package_type,
    p.itinerary, p.duration, p.meeting_location, p.inclusion, p.joiner_date, p.joiner_slots, p.joiner_booking_deadline,
    a.first_name, a.last_name, a.email, a.contact_number,
    CONCAT(a.first_name, ' ', a.last_name) AS customer_name, g.guide_id, CONCAT(ga.first_name, ' ', ga.last_name) AS guide_name,
    (SELECT payment_method FROM payment WHERE booking_id = b.booking_id AND deleted_at IS NULL ORDER BY payment_id DESC LIMIT 1) AS payment_method,
    (SELECT payment_status FROM payment WHERE booking_id = b.booking_id AND deleted_at IS NULL ORDER BY payment_id DESC LIMIT 1) AS payment_status,
    (SELECT transaction_reference FROM payment WHERE booking_id = b.booking_id AND deleted_at IS NULL ORDER BY payment_id DESC LIMIT 1) AS payment_transaction_reference,
    (SELECT payment_date FROM payment WHERE booking_id = b.booking_id AND deleted_at IS NULL ORDER BY payment_id DESC LIMIT 1) AS payment_date,
    EXISTS(SELECT 1 FROM review r WHERE r.booking_id = b.booking_id) AS has_reviewed
    FROM booking b JOIN account a ON a.account_id = b.account_id LEFT JOIN tour_package p ON p.package_id = b.package_id
    LEFT JOIN tour_guide g ON g.guide_id = b.guide_id LEFT JOIN account ga ON ga.account_id = g.account_id`;


router.get("/", requireAuth, async (req, res, next) => {
    try {
        await db.query("UPDATE booking SET booking_status = 'Completed' WHERE travel_date < CURRENT_DATE AND booking_status IN ('Confirmed', 'Rescheduled') AND deleted_at IS NULL");
        const admin = ["Admin", "Tour Guide"].includes(req.user.role);
        const { rows } = await db.query(`${bookingSelect} WHERE b.deleted_at IS NULL${admin ? "" : " AND b.account_id = $1"} ORDER BY b.created_at DESC`, admin ? [] : [req.user.accountId]);
        res.json(rows);
    } catch (e) { next(e); }
});
router.get("/mine", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(`${bookingSelect} WHERE b.account_id = $1 AND b.deleted_at IS NULL ORDER BY b.created_at DESC`, [req.user.accountId]);
        res.json(rows);
    } catch (e) { next(e); }
});
router.get("/joiner-availability/:packageId", async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `SELECT p.package_id, p.joiner_date::text AS joiner_date, p.joiner_booking_deadline::text AS joiner_booking_deadline,
                    p.joiner_slots, p.max_capacity,
                    COALESCE(SUM(b.number_of_persons) FILTER (WHERE b.booking_status IN ('Pending', 'Confirmed', 'Rescheduled') AND b.deleted_at IS NULL), 0)::int AS reserved_slots
             FROM tour_package p
             LEFT JOIN booking b ON b.package_id = p.package_id AND b.travel_date = p.joiner_date
             WHERE p.package_id = $1 AND LOWER(p.package_type) = 'joiner' AND p.availability_status = 'Available' AND p.deleted_at IS NULL
             GROUP BY p.package_id`,
            [req.params.packageId]
        );
        const trip = rows[0];
        if (!trip) return res.status(404).json({ message: "Joiner departure not found." });
        const slotLimit = Math.min(Number(trip.joiner_slots || 0), Number(trip.max_capacity || trip.joiner_slots || 0));
        const remainingSlots = Math.max(0, slotLimit - Number(trip.reserved_slots || 0));
        const { rows: [{ today }] } = await db.query("SELECT CURRENT_DATE::text AS today");
        const deadlineValid = Boolean(trip.joiner_booking_deadline && trip.joiner_date && trip.joiner_booking_deadline <= trip.joiner_date);
        const bookingOpen = Boolean(trip.joiner_date && deadlineValid && trip.joiner_date >= today && remainingSlots > 0 && (!trip.joiner_booking_deadline || today <= trip.joiner_booking_deadline));
        res.json({
            packageId: String(trip.package_id),
            departureDate: trip.joiner_date,
            bookingDeadline: trip.joiner_booking_deadline,
            scheduleValid: deadlineValid,
            totalSlots: slotLimit,
            reservedSlots: Number(trip.reserved_slots || 0),
            remainingSlots,
            bookingOpen,
        });
    } catch (e) { next(e); }
});
router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        await db.query("UPDATE booking SET booking_status = 'Completed' WHERE booking_id = $1 AND travel_date < CURRENT_DATE AND booking_status IN ('Confirmed', 'Rescheduled') AND deleted_at IS NULL", [req.params.id]);
        const { rows } = await db.query(`${bookingSelect} WHERE b.booking_id = $1 AND b.deleted_at IS NULL`, [req.params.id]);
        const booking = rows[0];
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (req.user.role === "Customer" && booking.account_id !== req.user.accountId) return res.status(403).json({ message: "Forbidden." });
        res.json(booking);
    } catch (e) { next(e); }
});
router.post("/", requireAuth, async (req, res, next) => {
    try {
        const { package_id, travel_date, number_of_persons } = req.body;
        const customizedDetails = req.body.customized_details;
        const isCustomTrip = !package_id
            && customizedDetails
            && typeof customizedDetails === "object"
            && !Array.isArray(customizedDetails)
            && typeof customizedDetails.destination === "string";

        if ((!package_id && !isCustomTrip) || !travel_date || !Number.isInteger(Number(number_of_persons)) || Number(number_of_persons) < 1) {
            return res.status(422).json({ message: "A package or customized trip, travel_date, and a positive number_of_persons are required." });
        }
        let pkg = null;
        const reference = `RBT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const client = await db.connect();
        let inserted;
        try {
            await client.query("BEGIN");
            if (package_id) {
                const { rows: packages } = await client.query(
                    "SELECT price, max_capacity, package_type, joiner_date, joiner_slots, joiner_booking_deadline FROM tour_package WHERE package_id = $1 AND availability_status = 'Available' AND deleted_at IS NULL FOR UPDATE",
                    [package_id]
                );
                pkg = packages[0];
                if (!pkg) throw Object.assign(new Error("Available tour package not found."), { status: 404 });
            }

            const guestCount = Number(number_of_persons);
            const isJoiner = String(pkg?.package_type || "").toLowerCase() === "joiner";
            if (isJoiner) {
                const scheduledDate = pkg.joiner_date ? String(pkg.joiner_date).slice(0, 10) : "";
                const bookingDeadline = pkg.joiner_booking_deadline ? String(pkg.joiner_booking_deadline).slice(0, 10) : "";
                const { rows: [{ today }] } = await client.query("SELECT CURRENT_DATE::text AS today");
                if (!scheduledDate || !bookingDeadline || !Number(pkg.joiner_slots)) {
                    throw Object.assign(new Error("This Joiner trip is not currently open for booking."), { status: 409 });
                }
                if (scheduledDate < today) {
                    throw Object.assign(new Error("This Joiner departure has already passed."), { status: 409 });
                }
                if (travel_date !== scheduledDate) {
                    throw Object.assign(new Error("Joiner bookings are only available for the published departure date."), { status: 422 });
                }
                if (bookingDeadline && today > bookingDeadline) {
                    throw Object.assign(new Error("The booking deadline for this Joiner departure has passed."), { status: 409 });
                }
                if (bookingDeadline && bookingDeadline > scheduledDate) {
                    throw Object.assign(new Error("This Joiner departure has an invalid booking deadline. Please contact the tour operator."), { status: 409 });
                }
                const seatLimit = Math.min(Number(pkg.joiner_slots), Number(pkg.max_capacity || pkg.joiner_slots));
                const { rows: [reservation] } = await client.query(
                    "SELECT COALESCE(SUM(number_of_persons), 0)::int AS reserved FROM booking WHERE package_id = $1 AND travel_date = $2 AND booking_status IN ('Pending', 'Confirmed', 'Rescheduled') AND deleted_at IS NULL",
                    [package_id, scheduledDate]
                );
                const seatsRemaining = Math.max(0, seatLimit - Number(reservation.reserved));
                if (guestCount > seatsRemaining) {
                    throw Object.assign(new Error(`Only ${seatsRemaining} Joiner spot${seatsRemaining === 1 ? '' : 's'} remain for this departure.`), { status: 409 });
                }
            } else if (pkg?.max_capacity && guestCount > Number(pkg.max_capacity)) {
                throw Object.assign(new Error(`Number of persons exceeds package capacity (${pkg.max_capacity} pax).`), { status: 422 });
            }

            const totalAmount = pkg
                ? Number(pkg.price) * (isJoiner ? guestCount : 1)
                : 0;
            const result = await client.query(
                "INSERT INTO booking (account_id, package_id, booking_reference, booking_date, travel_date, number_of_persons, total_amount, customized_details) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7) RETURNING booking_id",
                [req.user.accountId, package_id || null, reference, travel_date, guestCount, totalAmount, customizedDetails ? JSON.stringify(customizedDetails) : null]
            );
            inserted = result.rows;
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
        const newBookingId = inserted[0].booking_id;
        const { rows } = await db.query(`${bookingSelect} WHERE b.booking_id = $1`, [newBookingId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "CREATE", tableName: "booking", recordId: newBookingId, newValues: rows[0], req });
    // Create notifications for admins
    const { rows: admins } = await db.query("SELECT account_id FROM account WHERE role = 'Admin' AND deleted_at IS NULL");
    for (const admin of admins) {
      await db.query("INSERT INTO notification (account_id, booking_id, title, message, notification_type) VALUES ($1, $2, $3, $4, $5)", [admin.account_id, newBookingId, "New Tour Booking", `A new tour booking (${reference}) has been placed.`, "Booking"]);
    }
    // Send the customer a complete confirmation after the booking is stored.
    // Do not await/fail the request on mail-provider errors.
    try { await sendBookingConfirmation(rows[0], isCustomTrip ? "custom-request" : "tour"); } catch (error) { console.error("[booking] confirmation email error:", error.message); }
    res.status(201).json(rows[0]); } catch (e) { next(e); }
});
router.patch("/:id/reschedule", requireAuth, async (req, res, next) => {
    try {
        const { requested_schedule_date } = req.body;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(requested_schedule_date || ""))) {
            return res.status(422).json({ message: "A valid new travel date is required." });
        }


        const { rows: existingRows } = await db.query(
            "SELECT b.*, p.max_capacity, p.package_type FROM booking b JOIN tour_package p ON p.package_id = b.package_id WHERE b.booking_id = $1 AND b.deleted_at IS NULL",
            [req.params.id]
        );
        const booking = existingRows[0];
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (req.user.role === "Customer" && booking.account_id !== req.user.accountId) return res.status(403).json({ message: "Forbidden." });
        if (["Completed"].includes(booking.booking_status)) return res.status(422).json({ message: "Completed bookings cannot be rescheduled." });
        if (String(booking.package_type || "").toLowerCase() === "joiner") {
            return res.status(422).json({ message: "Joiner bookings are tied to their published departure date. Please choose another Joiner departure to change dates." });
        }


        const { rows: capacityRows } = await db.query(
            "SELECT COALESCE(SUM(number_of_persons), 0) AS reserved FROM booking WHERE package_id = $1 AND travel_date = $2 AND booking_id <> $3 AND booking_status IN ('Pending', 'Confirmed', 'Rescheduled') AND deleted_at IS NULL",
            [booking.package_id, requested_schedule_date, req.params.id]
        );
        if (Number(capacityRows[0].reserved) + Number(booking.number_of_persons) > Number(booking.max_capacity)) {
            return res.status(409).json({ message: "That date is not available for the selected number of guests." });
        }


        await db.query("UPDATE booking SET travel_date = $1, booking_status = 'Rescheduled' WHERE booking_id = $2 AND deleted_at IS NULL", [requested_schedule_date, req.params.id]);
        const { rows } = await db.query(`${bookingSelect} WHERE b.booking_id = $1`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "RESCHEDULE", tableName: "booking", recordId: req.params.id, oldValues: booking, newValues: rows[0], req });
        res.json(rows[0]);
    } catch (e) { next(e); }
});
router.patch("/:id/status", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => {
    try {
        const allowed = ["Pending", "Confirmed", "Rescheduled", "Completed", "Cancelled"];
        if (!allowed.includes(req.body.booking_status)) return res.status(422).json({ message: "Invalid booking_status." });
        const { rows: before } = await db.query(
            "SELECT b.*, p.package_type FROM booking b LEFT JOIN tour_package p ON p.package_id = b.package_id WHERE b.booking_id = $1 AND b.deleted_at IS NULL",
            [req.params.id]
        );
        if (!before[0]) return res.status(404).json({ message: "Booking not found." });
        if (["Completed", "Cancelled"].includes(before[0].booking_status)) {
            return res.status(409).json({ message: `${before[0].booking_status} bookings cannot be updated.` });
        }
        if (req.body.booking_status === "Completed" && String(before[0].package_type || "").toLowerCase() === "joiner") {
            const { rows: [{ today }] } = await db.query("SELECT CURRENT_DATE::text AS today");
            if (String(before[0].travel_date).slice(0, 10) >= today) {
                return res.status(409).json({ message: "A Joiner booking cannot be completed before its departure date." });
            }
        }
        const result = await db.query("UPDATE booking SET booking_status = $1 WHERE booking_id = $2 AND deleted_at IS NULL", [req.body.booking_status, req.params.id]);
        if (!result.rowCount) return res.status(404).json({ message: "Booking not found." });
        const { rows } = await db.query(`${bookingSelect} WHERE b.booking_id = $1`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: req.body.booking_status === "Cancelled" ? "CANCEL" : "UPDATE_STATUS", tableName: "booking", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req });
        res.json(rows[0]);
    } catch (e) { next(e); }
});
module.exports = router;
