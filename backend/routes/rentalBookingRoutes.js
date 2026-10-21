const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { logAudit } = require("../utils/auditLogger");
const { sendBookingConfirmation } = require("../config/mailer");
const router = express.Router();

const bookingSelect = `SELECT b.*, 
    v.vehicle_name, v.plate_number, v.daily_rate, v.image as vehicle_image,
    a.first_name, a.last_name, a.email, a.contact_number,
    CONCAT(a.first_name, ' ', a.last_name) AS customer_name,
    EXISTS(SELECT 1 FROM review r WHERE r.rental_booking_id = b.rental_booking_id AND r.deleted_at IS NULL) AS has_reviewed
    FROM car_rental_booking b 
    JOIN account a ON a.account_id = b.account_id 
    JOIN vehicle v ON v.vehicle_id = b.vehicle_id`;

router.get("/", requireAuth, async (req, res, next) => {
    try {
        await db.query("UPDATE car_rental_booking SET booking_status = 'Completed' WHERE return_date <= NOW() AND booking_status IN ('Confirmed', 'Rescheduled') AND deleted_at IS NULL");
        const admin = ["Admin", "Tour Guide"].includes(req.user.role);
        const { rows } = await db.query(
            `${bookingSelect} WHERE b.deleted_at IS NULL${admin ? "" : " AND b.account_id = $1"} ORDER BY b.created_at DESC`,
            admin ? [] : [req.user.accountId]
        );
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        await db.query("UPDATE car_rental_booking SET booking_status = 'Completed' WHERE rental_booking_id = $1 AND return_date <= NOW() AND booking_status IN ('Confirmed', 'Rescheduled') AND deleted_at IS NULL", [req.params.id]);
        const { rows } = await db.query(`${bookingSelect} WHERE b.rental_booking_id = $1 AND b.deleted_at IS NULL`, [req.params.id]);
        const booking = rows[0];
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (req.user.role === "Customer" && booking.account_id !== req.user.accountId) return res.status(403).json({ message: "Forbidden." });
        res.json(booking);
    } catch (e) {
        next(e);
    }
});

router.post("/", requireAuth, async (req, res, next) => {
    try {
        const { vehicle_id, pickup_date, return_date, pickup_location, payment_method, payment_reference } = req.body;

        if (!vehicle_id || !pickup_date || !return_date || !pickup_location) {
            return res.status(422).json({ message: "vehicle_id, pickup_date, return_date, and pickup_location are required." });
        }

        const { rows: vehicles } = await db.query(
            "SELECT daily_rate FROM vehicle WHERE vehicle_id = $1 AND availability_status = 'Available' AND deleted_at IS NULL",
            [vehicle_id]
        );

        const vehicle = vehicles[0];
        if (!vehicle) return res.status(404).json({ message: "Available vehicle not found." });

        const start = new Date(pickup_date);
        const end = new Date(return_date);
        if (end <= start) return res.status(422).json({ message: "Return date must be after pickup date." });

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalAmount = Number(vehicle.daily_rate) * diffDays;
        const reference = payment_reference?.trim() || `RBC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const paymentMethod = payment_method?.trim() || 'GCash';

        const { rows: inserted } = await db.query(
            "INSERT INTO car_rental_booking (account_id, vehicle_id, booking_reference, booking_date, pickup_date, return_date, pickup_location, total_amount, booking_status, payment_method) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, 'Pending', $8) RETURNING rental_booking_id",
            [req.user.accountId, vehicle_id, reference, pickup_date, return_date, pickup_location, totalAmount, paymentMethod]
        );

        const newBookingId = inserted[0].rental_booking_id;
        const { rows } = await db.query(`${bookingSelect} WHERE b.rental_booking_id = $1`, [newBookingId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "CREATE", tableName: "car_rental_booking", recordId: newBookingId, newValues: rows[0], req });

        // Create notifications for admins
        const { rows: admins } = await db.query("SELECT account_id FROM account WHERE role = 'Admin' AND deleted_at IS NULL");
        for (const admin of admins) {
          await db.query("INSERT INTO notification (account_id, title, message, notification_type) VALUES ($1, $2, $3, $4)", [admin.account_id, "New Car Rental Booking", `A new car rental booking (${reference}) has been placed.`, "Booking"]);
        }

        // Send the customer a complete rental confirmation after the booking is stored.
        // Do not fail an otherwise successful booking when email delivery is unavailable.
        try { await sendBookingConfirmation(rows[0], "rental"); } catch (error) { console.error("[rental-booking] confirmation email error:", error.message); }
        res.status(201).json(rows[0]);
    } catch (e) {
        next(e);
    }
});

router.patch("/:id/reschedule", requireAuth, async (req, res, next) => {
    try {
        const { requested_schedule_date } = req.body;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(requested_schedule_date || ""))) {
            return res.status(422).json({ message: "A valid new pickup date is required." });
        }
        const { rows: existingRows } = await db.query("SELECT * FROM car_rental_booking WHERE rental_booking_id = $1 AND deleted_at IS NULL", [req.params.id]);
        const booking = existingRows[0];
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (req.user.role === "Customer" && booking.account_id !== req.user.accountId) return res.status(403).json({ message: "Forbidden." });
        if (["Completed"].includes(booking.booking_status)) return res.status(422).json({ message: "Completed bookings cannot be rescheduled." });

        const oldStart = new Date(booking.pickup_date);
        const oldEnd = new Date(booking.return_date);
        const rentalDays = Math.max(1, Math.ceil((oldEnd - oldStart) / (1000 * 60 * 60 * 24)));
        const nextStart = new Date(`${requested_schedule_date}T00:00:00`);
        const nextEnd = new Date(nextStart);
        nextEnd.setDate(nextEnd.getDate() + rentalDays);
        const nextEndDate = nextEnd.toISOString().slice(0, 10);

        const { rows: conflicts } = await db.query(
            "SELECT rental_booking_id FROM car_rental_booking WHERE vehicle_id = $1 AND rental_booking_id <> $2 AND booking_status IN ('Pending', 'Confirmed', 'Rescheduled') AND deleted_at IS NULL AND pickup_date < $3 AND return_date > $4 LIMIT 1",
            [booking.vehicle_id, req.params.id, nextEndDate, requested_schedule_date]
        );
        if (conflicts.length) return res.status(409).json({ message: "That date is not available for this vehicle." });

        await db.query("UPDATE car_rental_booking SET pickup_date = $1, return_date = $2, booking_status = 'Rescheduled' WHERE rental_booking_id = $3 AND deleted_at IS NULL", [requested_schedule_date, nextEndDate, req.params.id]);
        const { rows } = await db.query(`${bookingSelect} WHERE b.rental_booking_id = $1`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "RESCHEDULE", tableName: "car_rental_booking", recordId: req.params.id, oldValues: booking, newValues: rows[0], req });
        res.json(rows[0]);
    } catch (e) { next(e); }
});

router.patch("/:id/status", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => {
    try {
        const allowed = ["Pending", "Confirmed", "Rescheduled", "Completed"];
        if (!allowed.includes(req.body.booking_status)) return res.status(422).json({ message: "Invalid booking_status." });

        const { rows: before } = await db.query("SELECT * FROM car_rental_booking WHERE rental_booking_id = $1 AND deleted_at IS NULL", [req.params.id]);
        const result = await db.query(
            "UPDATE car_rental_booking SET booking_status = $1 WHERE rental_booking_id = $2 AND deleted_at IS NULL",
            [req.body.booking_status, req.params.id]
        );

        if (!result.rowCount) return res.status(404).json({ message: "Booking not found." });

        const { rows } = await db.query(`${bookingSelect} WHERE b.rental_booking_id = $1`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_STATUS", tableName: "car_rental_booking", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req });
        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
