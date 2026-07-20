const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const [reviews] = await db.execute(`
            SELECT r.review_id, r.booking_id, r.package_id, r.rating, r.comment, r.created_at, a.first_name, a.last_name 
            FROM review r
            JOIN account a ON r.account_id = a.account_id
            WHERE r.deleted_at IS NULL
            ORDER BY r.created_at DESC
        `);
        res.json(reviews);
    } catch (error) { next(error); }
});

router.post("/", requireAuth, async (req, res, next) => {
    try {
        const { booking_id, rating, comment } = req.body;
        if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(422).json({ message: "Rating must be between 1 and 5." });
        }
        const [bookings] = await db.execute("SELECT account_id, package_id FROM booking WHERE booking_id = ? AND deleted_at IS NULL", [booking_id]);
        const booking = bookings[0];
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (req.user.role === "Customer" && booking.account_id !== req.user.accountId) return res.status(403).json({ message: "You can only review your own booking." });
        const [result] = await db.execute("INSERT INTO review (account_id, package_id, booking_id, rating, comment) VALUES (?, ?, ?, ?, ?)", [req.user.accountId, booking.package_id, booking_id, rating, comment || null]);
        const [rows] = await db.execute("SELECT * FROM review WHERE review_id = ?", [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (error) { next(error); }
});

module.exports = router;
