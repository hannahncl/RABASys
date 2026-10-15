const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { logAudit } = require("../utils/auditLogger");
const { sendBookingConfirmation } = require("../config/mailer");
const router = express.Router();


const bookingSelect = `SELECT b.*,
    COALESCE(p.package_name, CONCAT('Customized Trip: ', JSON_UNQUOTE(JSON_EXTRACT(b.customized_details, '$.destination')))) AS package_name,
    COALESCE(p.destination, JSON_UNQUOTE(JSON_EXTRACT(b.customized_details, '$.destination'))) AS destination,
    COALESCE(p.package_type, CASE WHEN b.customized_details IS NOT NULL THEN 'customization' ELSE NULL END) AS package_type,
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
        const isCustomTrip = !package_id
            && customizedDetails
            && typeof customizedDetails === "object"
            && !Array.isArray(customizedDetails)
            && typeof customizedDetails.destination === "string";

        if ((!package_id && !isCustomTrip) || !travel_date || !Number.isInteger(Number(number_of_persons)) || Number(number_of_persons) < 1) {
            return res.status(422).json({ message: "A package or customized trip, travel_date, and a positive number_of_persons are required." });
        }

        let packagePrice = 0;
        let guideId = null;
        if (!isCustomTrip) {
            const [packages] = await db.execute("SELECT price, max_capacity, package_type, joiner_date, joiner_slots, joiner_booking_deadline FROM tour_package WHERE package_id = ? AND availability_status = 'Available' AND deleted_at IS NULL", [package_id]);
            const pkg = packages[0];
            if (!pkg) return res.status(404).json({ message: "Available tour package not found." });
            if (pkg.package_type === 'joiner') {
                const requestedDate = String(travel_date).slice(0, 10);
                const joinerDate = pkg.joiner_date ? new Date(pkg.joiner_date).toISOString().slice(0, 10) : null;
                const today = new Date().toISOString().slice(0, 10);
                const deadline = pkg.joiner_booking_deadline ? new Date(pkg.joiner_booking_deadline).toISOString().slice(0, 10) : null;
                if (joinerDate && requestedDate !== joinerDate) {
                    return res.status(422).json({ message: `This joiner trip is scheduled for ${joinerDate}.` });
                }
                if (deadline && today > deadline) {
                    return res.status(422).json({ message: "Booking for this joiner trip is already closed." });
                }
                if (pkg.joiner_slots) {
                    const [reservedRows] = await db.execute(
                        "SELECT COALESCE(SUM(number_of_persons), 0) AS reserved FROM booking WHERE package_id = ? AND travel_date = ? AND booking_status IN ('Pending', 'Confirmed', 'Rescheduled') AND deleted_at IS NULL",
                        [package_id, requestedDate]
                    );
                    const remaining = Number(pkg.joiner_slots) - Number(reservedRows[0]?.reserved || 0);
                    if (Number(number_of_persons) > remaining) {
                        return res.status(422).json({ message: `Only ${Math.max(remaining, 0)} joiner slot(s) remain.` });
                    }
                }
            }

            if (pkg.max_capacity && Number(number_of_persons) > Number(pkg.max_capacity)) {
                return res.status(422).json({ message: `Number of persons exceeds package capacity (${pkg.max_capacity} pax).` });
            }
            packagePrice = Number(pkg.price);
        } else if (customizedDetails.preferredGuideId) {
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
router.patch("/:id/quote", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const itinerary = typeof req.body.itinerary === "string" ? req.body.itinerary.trim() : "";
        const submittedLines = req.body.price_breakdown;
        if (!itinerary || itinerary.length > 10000 || !Array.isArray(submittedLines) || submittedLines.length === 0 || submittedLines.length > 30) {
            return res.status(422).json({ message: "Provide an itinerary and between 1 and 30 price breakdown items." });
        }

        const priceBreakdown = submittedLines.map((line) => ({
            description: typeof line.description === "string" ? line.description.trim() : "",
            amount: Number(line.amount),
        }));
        if (priceBreakdown.some(line => !line.description || line.description.length > 120 || !Number.isFinite(line.amount) || line.amount < 0)) {
            return res.status(422).json({ message: "Each price item needs a description and a valid non-negative amount." });
        }

        const totalAmount = Math.round(priceBreakdown.reduce((total, line) => total + line.amount, 0) * 100) / 100;
        if (totalAmount <= 0) return res.status(422).json({ message: "The total quote must be greater than zero." });

        const [beforeRows] = await db.execute(
            "SELECT * FROM booking WHERE booking_id = ? AND deleted_at IS NULL",
            [req.params.id]
        );
        const before = beforeRows[0];
        if (!before) return res.status(404).json({ message: "Customized trip request not found." });
        if (!before.customized_details) return res.status(422).json({ message: "This booking is not a customized trip request." });
        if (!["Pending", "Quote Sent"].includes(before.booking_status)) {
            return res.status(409).json({ message: "A quote can only be sent for a pending customized trip request." });
        }

        const customizedDetails = typeof before.customized_details === "string"
            ? JSON.parse(before.customized_details)
            : before.customized_details;
        customizedDetails.quoteItinerary = itinerary;
        customizedDetails.priceBreakdown = priceBreakdown;

        await db.execute(
            "UPDATE booking SET booking_status = 'Quote Sent', total_amount = ?, customized_details = ? WHERE booking_id = ? AND deleted_at IS NULL",
            [totalAmount, JSON.stringify(customizedDetails), req.params.id]
        );
        const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ?`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "SEND_CUSTOM_QUOTE", tableName: "booking", recordId: req.params.id, oldValues: before, newValues: rows[0], req });
        try { await sendBookingConfirmation(rows[0], "custom-quote"); } catch (error) { console.error("[booking] custom quote email error:", error.message); }
        res.json(rows[0]);
    } catch (e) { next(e); }
});
router.patch("/:id/accept-quote", requireAuth, async (req, res, next) => {
    try {
        if (req.user.role !== "Customer") return res.status(403).json({ message: "Only the customer can accept this quote." });
        const [beforeRows] = await db.execute("SELECT * FROM booking WHERE booking_id = ? AND deleted_at IS NULL", [req.params.id]);
        const before = beforeRows[0];
        if (!before) return res.status(404).json({ message: "Customized trip request not found." });
        if (Number(before.account_id) !== Number(req.user.accountId)) return res.status(403).json({ message: "You cannot accept another customer's quote." });
        if (!before.customized_details || before.booking_status !== "Quote Sent") {
            return res.status(409).json({ message: "This customized trip does not have a quote awaiting acceptance." });
        }

        await db.execute("UPDATE booking SET booking_status = 'Quote Accepted' WHERE booking_id = ? AND deleted_at IS NULL", [req.params.id]);
        const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ?`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "ACCEPT_CUSTOM_QUOTE", tableName: "booking", recordId: req.params.id, oldValues: before, newValues: rows[0], req });

        const [admins] = await db.execute("SELECT account_id FROM account WHERE role = 'Admin' AND deleted_at IS NULL");
        for (const admin of admins) {
            await db.execute(
                "INSERT INTO notification (account_id, booking_id, title, message, notification_type) VALUES (?, ?, ?, ?, ?)",
                [admin.account_id, req.params.id, "Custom Trip Quote Accepted", `The customer accepted quote ${before.booking_reference}.`, "Booking"]
            );
        }
        try { await sendBookingConfirmation(rows[0], "custom-accepted"); } catch (error) { console.error("[booking] custom acceptance email error:", error.message); }
        res.json(rows[0]);
    } catch (e) { next(e); }
});
router.post("/:id/sample-payment", requireAuth, async (req, res, next) => {
    if (req.user.role !== "Customer") return res.status(403).json({ message: "Only the customer can pay for this quote." });
    const paymentMethod = req.body.payment_method;
    if (!["GCash", "Credit Card"].includes(paymentMethod)) {
        return res.status(422).json({ message: "Choose GCash or Credit Card for the sample payment." });
    }

    const connection = await db.getConnection();
    let before;
    let paymentReference;
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
            "SELECT * FROM booking WHERE booking_id = ? AND deleted_at IS NULL FOR UPDATE",
            [req.params.id]
        );
        before = rows[0];
        if (!before) {
            await connection.rollback();
            return res.status(404).json({ message: "Customized trip request not found." });
        }
        if (Number(before.account_id) !== Number(req.user.accountId)) {
            await connection.rollback();
            return res.status(403).json({ message: "You cannot pay for another customer's quote." });
        }

        const customizedDetails = typeof before.customized_details === "string"
            ? JSON.parse(before.customized_details)
            : before.customized_details;
        if (!customizedDetails?.quoteItinerary || !Array.isArray(customizedDetails.priceBreakdown) || !customizedDetails.priceBreakdown.length || Number(before.total_amount) <= 0) {
            await connection.rollback();
            return res.status(409).json({ message: "This customized trip does not have a payable quote." });
        }
        if (!["Pending", "Quote Sent", "Quote Accepted", "Confirmed"].includes(before.booking_status)) {
            await connection.rollback();
            return res.status(409).json({ message: "This quote is not available for sample payment." });
        }

        const [existingPayments] = await connection.execute(
            "SELECT payment_id FROM payment WHERE booking_id = ? AND payment_status = 'Sample' AND deleted_at IS NULL LIMIT 1",
            [req.params.id]
        );
        if (existingPayments.length) {
            await connection.rollback();
            return res.status(409).json({ message: "A sample payment has already been recorded for this quote." });
        }

        paymentReference = `SAMPLE-${paymentMethod === "GCash" ? "GCASH" : "CARD"}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        await connection.execute(
            "INSERT INTO payment (booking_id, transaction_reference, payment_date, amount, payment_method, payment_status) VALUES (?, ?, NOW(), ?, ?, 'Sample')",
            [req.params.id, paymentReference, Number(before.total_amount), `Sample ${paymentMethod}`]
        );
        await connection.execute(
            "UPDATE booking SET booking_status = 'Confirmed' WHERE booking_id = ? AND deleted_at IS NULL",
            [req.params.id]
        );
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        connection.release();
        return next(error);
    }
    connection.release();

    try {
        const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ? AND b.deleted_at IS NULL`, [req.params.id]);
        const booking = rows[0];
        try {
            await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "SAMPLE_PAYMENT", tableName: "booking", recordId: req.params.id, oldValues: before, newValues: { ...booking, payment_reference: paymentReference }, req });
        } catch (error) {
            console.error("[booking] sample payment audit error:", error.message);
        }

        try {
            const [admins] = await db.execute("SELECT account_id FROM account WHERE role = 'Admin' AND deleted_at IS NULL");
            for (const admin of admins) {
                await db.execute(
                    "INSERT INTO notification (account_id, booking_id, title, message, notification_type) VALUES (?, ?, ?, ?, ?)",
                    [admin.account_id, req.params.id, "Sample Payment Recorded", `Sample payment ${paymentReference} was recorded for quote ${before.booking_reference}. No real payment was processed.`, "Booking"]
                );
            }
        } catch (error) {
            console.error("[booking] sample payment notification error:", error.message);
        }
        try { await sendBookingConfirmation(booking, "custom-sample-payment"); } catch (error) { console.error("[booking] sample payment email error:", error.message); }
        res.json(booking);
    } catch (error) { next(error); }
});

router.patch("/:id/status", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => { try { const allowed = ["Pending", "Confirmed", "Rescheduled", "Completed"]; if (!allowed.includes(req.body.booking_status)) return res.status(422).json({ message: "Invalid booking_status." }); const [before] = await db.execute("SELECT * FROM booking WHERE booking_id = ? AND deleted_at IS NULL", [req.params.id]); const [result] = await db.execute("UPDATE booking SET booking_status = ? WHERE booking_id = ? AND deleted_at IS NULL", [req.body.booking_status, req.params.id]); if (!result.affectedRows) return res.status(404).json({ message: "Booking not found." }); const [rows] = await db.execute(`${bookingSelect} WHERE b.booking_id = ?`, [req.params.id]); await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_STATUS", tableName: "booking", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req }); res.json(rows[0]); } catch (e) { next(e); } });
module.exports = router;



