const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { logAudit } = require("../utils/auditLogger");
const { sendBookingConfirmation } = require("../config/mailer");
const router = express.Router();

const bookingSelect = `SELECT b.*, COALESCE(p.package_name, CONCAT('Customized Trip: ', JSON_UNQUOTE(JSON_EXTRACT(b.customized_details, '$.destination')))) AS package_name,
    COALESCE(p.destination, JSON_UNQUOTE(JSON_EXTRACT(b.customized_details, '$.destination'))) AS destination, a.first_name, a.last_name, a.email, a.contact_number,
    CONCAT(a.first_name, ' ', a.last_name) AS customer_name, g.guide_id, CONCAT(ga.first_name, ' ', ga.last_name) AS guide_name,
    EXISTS(SELECT 1 FROM review r WHERE r.booking_id = b.booking_id) AS has_reviewed
    FROM booking b JOIN account a ON a.account_id = b.account_id LEFT JOIN tour_package p ON p.package_id = b.package_id
    LEFT JOIN tour_guide g ON g.guide_id = b.guide_id LEFT JOIN account ga ON ga.account_id = g.account_id`;

router.get("/", requireAuth, async (req, res, next) => {
    try {
        await db.execute("UPDATE booking SET booking_status = 'Completed' WHERE travel_date < CURDATE() AND booking_status IN ('Confirmed', 'Rescheduled') AND deleted_at IS NULL");
        const admin = ["Admin", "Tour Guide"].includes(req.user.role);
        const [rows] = await db.execute(`${bookingSelect} WHERE b.deleted_at IS NULL${admin ? "" : " AND b.account_id = ?"} ORDER BY b.created_at DESC`, admin ? [] : [req.user.accountId]);
        res.json(rows);
    } catch (e) { next(e); }
});
router.get("/mine", requireAuth, async (req, res, next) => {
    try {
        const [rows] = await db.execute(`${bookingSelect} WHERE b.account_id = ? AND b.deleted_at IS NULL ORDER BY b.created_at DESC`, [req.user.accountId]);
        res.json(rows);
    } catch (e) { next(e); }
});
router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        await db.execute("UPDATE booking SET booking_status = 'Completed' WHERE booking_id = ? AND travel_date < CURDATE() AND booking_status IN ('Confirmed', 'Rescheduled') AND deleted_at IS NULL", [req.params.id]);
        const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ? AND b.deleted_at IS NULL`, [req.params.id]);
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
        const isCustomTrip = !package_id && customizedDetails && typeof customizedDetails === "object" && !Array.isArray(customizedDetails) && typeof customizedDetails.destination === "string";
        if ((!package_id && !isCustomTrip) || !travel_date || !Number.isInteger(Number(number_of_persons)) || Number(number_of_persons) < 1) {
            return res.status(422).json({ message: "A package or customized trip, travel_date, and a positive number_of_persons are required." });
        }
        let packagePrice = 0;
        if (package_id) {
            const [packages] = await db.execute("SELECT price, max_capacity FROM tour_package WHERE package_id = ? AND availability_status = 'Available' AND deleted_at IS NULL", [package_id]);
            const pkg = packages[0];
            if (!pkg) return res.status(404).json({ message: "Available tour package not found." });
            if (pkg.max_capacity && Number(number_of_persons) > Number(pkg.max_capacity)) {
                return res.status(422).json({ message: `Number of persons exceeds package capacity (${pkg.max_capacity} pax).` });
            }
            packagePrice = Number(pkg.price);
        }

        let guideId = null;
        if (customizedDetails?.preferredGuideId) {
            const [guides] = await db.execute(
                "SELECT tg.guide_id, CONCAT(a.first_name, ' ', a.last_name) AS guide_name FROM tour_guide tg JOIN account a ON a.account_id = tg.account_id WHERE tg.guide_id = ? AND tg.availability_status = 'Available' AND tg.employment_status = 'Active' AND a.account_status = 'Active' AND a.deleted_at IS NULL",
                [customizedDetails.preferredGuideId]
            );
            if (!guides[0]) return res.status(422).json({ message: "The selected tour guide is no longer available." });
            guideId = guides[0].guide_id;
            customizedDetails.preferredGuideId = String(guideId);
            customizedDetails.preferredGuideName = guides[0].guide_name;
        }

        const reference = `RBT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const [result] = await db.execute(
            "INSERT INTO booking (account_id, package_id, guide_id, customized_details, booking_reference, booking_date, travel_date, number_of_persons, total_amount) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?)",
            [req.user.accountId, package_id || null, guideId, isCustomTrip ? JSON.stringify(customizedDetails) : null, reference, travel_date, number_of_persons, packagePrice]
        );
        const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ?`, [result.insertId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "CREATE", tableName: "booking", recordId: result.insertId, newValues: rows[0], req }); 
    // Create notifications for admins
    const [admins] = await db.execute("SELECT account_id FROM account WHERE role = 'Admin' AND deleted_at IS NULL");
    for (const admin of admins) {
      await db.execute("INSERT INTO notification (account_id, booking_id, title, message, notification_type) VALUES (?, ?, ?, ?, ?)", [admin.account_id, result.insertId, "New Tour Booking", `A new tour booking (${reference}) has been placed.`, "Booking"]);
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

        const [existingRows] = await db.execute(
            "SELECT b.*, p.max_capacity FROM booking b JOIN tour_package p ON p.package_id = b.package_id WHERE b.booking_id = ? AND b.deleted_at IS NULL",
            [req.params.id]
        );
        const booking = existingRows[0];
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (req.user.role === "Customer" && booking.account_id !== req.user.accountId) return res.status(403).json({ message: "Forbidden." });
        if (["Completed"].includes(booking.booking_status)) return res.status(422).json({ message: "Completed bookings cannot be rescheduled." });

        const [capacityRows] = await db.execute(
            "SELECT COALESCE(SUM(number_of_persons), 0) AS reserved FROM booking WHERE package_id = ? AND travel_date = ? AND booking_id <> ? AND booking_status IN ('Pending', 'Confirmed', 'Rescheduled') AND deleted_at IS NULL",
            [booking.package_id, requested_schedule_date, req.params.id]
        );
        if (Number(capacityRows[0].reserved) + Number(booking.number_of_persons) > Number(booking.max_capacity)) {
            return res.status(409).json({ message: "That date is not available for the selected number of guests." });
        }

        await db.execute("UPDATE booking SET travel_date = ?, booking_status = 'Rescheduled' WHERE booking_id = ? AND deleted_at IS NULL", [requested_schedule_date, req.params.id]);
        const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ?`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "RESCHEDULE", tableName: "booking", recordId: req.params.id, oldValues: booking, newValues: rows[0], req });
        res.json(rows[0]);
    } catch (e) { next(e); }
});
router.patch("/:id/status", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => {
    try {
        const allowed = ["Pending", "Quote Sent", "Confirmed", "Rescheduled", "Completed"];
        if (!allowed.includes(req.body.booking_status)) return res.status(422).json({ message: "Invalid booking_status." });

        const [beforeRows] = await db.execute("SELECT * FROM booking WHERE booking_id = ? AND deleted_at IS NULL", [req.params.id]);
        const before = beforeRows[0];
        if (!before) return res.status(404).json({ message: "Booking not found." });

        const isCustomTrip = Boolean(before.customized_details);
        const quoteAmount = Number(req.body.total_amount);
        if (isCustomTrip && req.body.booking_status === "Quote Sent" && (!Number.isFinite(quoteAmount) || quoteAmount <= 0)) {
            return res.status(422).json({ message: "Enter a final price greater than zero before sending the quote." });
        }

        const [result] = isCustomTrip && req.body.booking_status === "Quote Sent"
            ? await db.execute("UPDATE booking SET booking_status = ?, total_amount = ? WHERE booking_id = ? AND deleted_at IS NULL", [req.body.booking_status, quoteAmount, req.params.id])
            : await db.execute("UPDATE booking SET booking_status = ? WHERE booking_id = ? AND deleted_at IS NULL", [req.body.booking_status, req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ message: "Booking not found." });

        const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ?`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_STATUS", tableName: "booking", recordId: req.params.id, oldValues: before, newValues: rows[0], req });
        if (isCustomTrip && req.body.booking_status === "Quote Sent") {
            try { await sendBookingConfirmation(rows[0], "custom-quote"); } catch (error) { console.error("[booking] custom quote email error:", error.message); }
        }
        res.json(rows[0]);
    } catch (e) { next(e); }
});
module.exports = router;
