const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");
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
        const { vehicle_id, pickup_date, return_date, pickup_location } = req.body;
        
        if (!vehicle_id || !pickup_date || !return_date || !pickup_location) {
            return res.status(422).json({ message: "vehicle_id, pickup_date, return_date, and pickup_location are required." });
        }

        const [vehicles] = await db.execute(
            "SELECT daily_rate FROM vehicle WHERE vehicle_id = ? AND availability_status = 'Available' AND deleted_at IS NULL", 
            [vehicle_id]
        );
        
        const vehicle = vehicles[0];
        if (!vehicle) return res.status(404).json({ message: "Available vehicle not found." });

        // Calculate days
        const start = new Date(pickup_date);
        const end = new Date(return_date);
        if (end <= start) return res.status(422).json({ message: "Return date must be after pickup date." });
        
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalAmount = Number(vehicle.daily_rate) * diffDays;

        const reference = `RBC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        
        const [result] = await db.execute(
            "INSERT INTO car_rental_booking (account_id, vehicle_id, booking_reference, booking_date, pickup_date, return_date, pickup_location, total_amount) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)",
            [req.user.accountId, vehicle_id, reference, pickup_date, return_date, pickup_location, totalAmount]
        );
        
        const [rows] = await db.execute(`${bookingSelect} WHERE b.rental_booking_id = ?`, [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (e) {
        next(e);
    }
});

router.patch("/:id/status", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => {
    try {
        const allowed = ["Pending", "Confirmed", "Rescheduled", "Completed", "Cancelled"];
        if (!allowed.includes(req.body.booking_status)) return res.status(422).json({ message: "Invalid booking_status." });
        
        const [result] = await db.execute(
            "UPDATE car_rental_booking SET booking_status = ? WHERE rental_booking_id = ? AND deleted_at IS NULL", 
            [req.body.booking_status, req.params.id]
        );
        
        if (!result.affectedRows) return res.status(404).json({ message: "Booking not found." });
        
        const [rows] = await db.execute(`${bookingSelect} WHERE b.rental_booking_id = ?`, [req.params.id]);
        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
