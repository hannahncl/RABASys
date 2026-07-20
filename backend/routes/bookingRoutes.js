const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");
const router = express.Router();

const bookingSelect = `SELECT b.*, p.package_name, p.destination, a.first_name, a.last_name, a.email, a.contact_number,
    CONCAT(a.first_name, ' ', a.last_name) AS customer_name, g.guide_id, CONCAT(ga.first_name, ' ', ga.last_name) AS guide_name,
    EXISTS(SELECT 1 FROM review r WHERE r.booking_id = b.booking_id) AS has_reviewed
    FROM booking b JOIN account a ON a.account_id = b.account_id JOIN tour_package p ON p.package_id = b.package_id
    LEFT JOIN tour_guide g ON g.guide_id = b.guide_id LEFT JOIN account ga ON ga.account_id = g.account_id`;

router.get("/", requireAuth, async (req, res, next) => {
    try { const admin = ["Admin", "Tour Guide"].includes(req.user.role); const [rows] = await db.execute(`${bookingSelect} WHERE b.deleted_at IS NULL${admin ? "" : " AND b.account_id = ?"} ORDER BY b.created_at DESC`, admin ? [] : [req.user.accountId]); res.json(rows); } catch (e) { next(e); }
});
router.get("/:id", requireAuth, async (req, res, next) => {
    try { const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ? AND b.deleted_at IS NULL`, [req.params.id]); const booking = rows[0]; if (!booking) return res.status(404).json({ message: "Booking not found." }); if (req.user.role === "Customer" && booking.account_id !== req.user.accountId) return res.status(403).json({ message: "Forbidden." }); res.json(booking); } catch (e) { next(e); }
});
router.post("/", requireAuth, async (req, res, next) => {
    try { const { package_id, travel_date, number_of_persons } = req.body; if (!package_id || !travel_date || !Number.isInteger(Number(number_of_persons)) || Number(number_of_persons) < 1) return res.status(422).json({ message: "package_id, travel_date, and a positive number_of_persons are required." }); const [packages] = await db.execute("SELECT price, max_capacity FROM tour_package WHERE package_id = ? AND availability_status = 'Available' AND deleted_at IS NULL", [package_id]); const pkg = packages[0]; if (!pkg) return res.status(404).json({ message: "Available tour package not found." }); if (Number(number_of_persons) > pkg.max_capacity) return res.status(422).json({ message: "Number of persons exceeds package capacity." }); const reference = `RBT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; const [result] = await db.execute("INSERT INTO booking (account_id, package_id, booking_reference, booking_date, travel_date, number_of_persons, total_amount) VALUES (?, ?, ?, NOW(), ?, ?, ?)", [req.user.accountId, package_id, reference, travel_date, number_of_persons, Number(pkg.price) * Number(number_of_persons)]); const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ?`, [result.insertId]); res.status(201).json(rows[0]); } catch (e) { next(e); }
});
router.patch("/:id/status", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => { try { const allowed = ["Pending", "Confirmed", "Rescheduled", "Completed"]; if (!allowed.includes(req.body.booking_status)) return res.status(422).json({ message: "Invalid booking_status." }); const [result] = await db.execute("UPDATE booking SET booking_status = ? WHERE booking_id = ? AND deleted_at IS NULL", [req.body.booking_status, req.params.id]); if (!result.affectedRows) return res.status(404).json({ message: "Booking not found." }); const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ?`, [req.params.id]); res.json(rows[0]); } catch (e) { next(e); } });
module.exports = router;
