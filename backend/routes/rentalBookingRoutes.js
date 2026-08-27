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
    CONCAT(a.first_name, ' ', a.last_name) AS customer_name
    FROM car_rental_booking b 
    JOIN account a ON a.account_id = b.account_id 
    JOIN vehicle v ON v.vehicle_id = b.vehicle_id`;

router.get("/", requireAuth, async (req, res, next) => {
    try {
        const admin = ["Admin", "Tour Guide"].includes(req.user.role);
        const [rows] = await db.execute(
            `${bookingSelect} WHERE b.deleted_at IS NULL${admin ? "" : " AND b.account_id = ?"} ORDER BY b.created_at DESC`,
            admin ? [] : [req.user.accountId]
        );
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        const [rows] = await db.execute(`${bookingSelect} WHERE b.rental_booking_id = ? AND b.deleted_at IS NULL`, [req.params.id]);
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

        const [vehicles] = await db.execute(
            "SELECT daily_rate FROM vehicle WHERE vehicle_id = ? AND availability_status = 'Available' AND deleted_at IS NULL",
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

        const [result] = await db.execute(
            "INSERT INTO car_rental_booking (account_id, vehicle_id, booking_reference, booking_date, pickup_date, return_date, pickup_location, total_amount, booking_status, payment_method) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, 'Pending', ?)",
            [req.user.accountId, vehicle_id, reference, pickup_date, return_date, pickup_location, totalAmount, paymentMethod]
        );

        const [rows] = await db.execute(`${bookingSelect} WHERE b.rental_booking_id = ?`, [result.insertId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "CREATE", tableName: "car_rental_booking", recordId: result.insertId, newValues: rows[0], req });
        
        // Create notifications for admins
        const [admins] = await db.execute("SELECT account_id FROM account WHERE role = 'Admin' AND deleted_at IS NULL");
        for (const admin of admins) {
          await db.execute("INSERT INTO notification (account_id, booking_id, title, message, notification_type) VALUES (?, ?, ?, ?, ?)", [admin.account_id, result.insertId, "New Car Rental Booking", `A new car rental booking (${reference}) has been placed.`, "Booking"]);
        }

        // Send the customer a complete rental confirmation after the booking is stored.
        // Do not fail an otherwise successful booking when email delivery is unavailable.
        try { await sendBookingConfirmation(rows[0], "rental"); } catch (error) { console.error("[rental-booking] confirmation email error:", error.message); }
        res.status(201).json(rows[0]);
    } catch (e) {
        next(e);
    }
});

router.patch("/:id/status", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => {
    try {
        const allowed = ["Pending", "Confirmed", "Rescheduled", "Completed", "Cancelled"];
        if (!allowed.includes(req.body.booking_status)) return res.status(422).json({ message: "Invalid booking_status." });

        const [before] = await db.execute("SELECT * FROM car_rental_booking WHERE rental_booking_id = ? AND deleted_at IS NULL", [req.params.id]);
        const [result] = await db.execute(
            "UPDATE car_rental_booking SET booking_status = ? WHERE rental_booking_id = ? AND deleted_at IS NULL",
            [req.body.booking_status, req.params.id]
        );

        if (!result.affectedRows) return res.status(404).json({ message: "Booking not found." });

        const [rows] = await db.execute(`${bookingSelect} WHERE b.rental_booking_id = ?`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_STATUS", tableName: "car_rental_booking", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req });
        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
