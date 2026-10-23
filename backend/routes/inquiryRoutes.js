const express = require("express");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();
const staffRoles = ["admin", "administrator", "superadmin", "staff", "tour guide", "tour-guide", "tourguide", "guide"];

const inquirySelect = `
    SELECT i.*, a.first_name, a.last_name, a.email,
           CONCAT(a.first_name, ' ', a.last_name) AS customer_name,
           (SELECT COUNT(*) FROM customer_inquiry_message m WHERE m.inquiry_id = i.inquiry_id) AS message_count,
           (SELECT MAX(created_at) FROM customer_inquiry_message m WHERE m.inquiry_id = i.inquiry_id) AS last_message_at
    FROM customer_inquiry i
    JOIN account a ON a.account_id = i.account_id
`;

const canManage = (req) => staffRoles.includes(String(req.user?.role || "").trim().toLowerCase());

router.get("/", requireAuth, async (req, res, next) => {
    try {
        const where = canManage(req) ? "" : "WHERE i.account_id = $1";
        const params = canManage(req) ? [] : [req.user.accountId];
        const { rows } = await db.query(`${inquirySelect} ${where} ORDER BY i.updated_at DESC, i.inquiry_id DESC`, params);
        res.json(rows);
    } catch (error) { next(error); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        const params = [req.params.id];
        const access = canManage(req) ? "" : " AND i.account_id = $2";
        if (!canManage(req)) params.push(req.user.accountId);
        const { rows: inquiries } = await db.query(`${inquirySelect} WHERE i.inquiry_id = $1${access}`, params);
        const inquiry = inquiries[0];
        if (!inquiry) return res.status(404).json({ message: "Inquiry not found." });
        const { rows: messages } = await db.query(
            `SELECT m.*, CONCAT(a.first_name, ' ', a.last_name) AS sender_name
             FROM customer_inquiry_message m
             JOIN account a ON a.account_id = m.sender_account_id
             WHERE m.inquiry_id = $1 ORDER BY m.created_at ASC, m.message_id ASC`,
            [req.params.id]
        );
        res.json({ inquiry, messages });
    } catch (error) { next(error); }
});

router.post("/", requireAuth, async (req, res, next) => {
    try {
        const subject = String(req.body.subject || "").trim();
        const message = String(req.body.message || "").trim();
        if (!subject || subject.length > 180 || !message || message.length > 4000) {
            return res.status(422).json({ message: "A subject and message are required." });
        }

        const client = await db.connect();
        try {
            await client.query("BEGIN");
            const { rows: created } = await client.query(
                "INSERT INTO customer_inquiry (account_id, subject) VALUES ($1, $2) RETURNING inquiry_id",
                [req.user.accountId, subject]
            );
            const inquiryId = created[0].inquiry_id;
            await client.query(
                "INSERT INTO customer_inquiry_message (inquiry_id, sender_account_id, sender_role, message) VALUES ($1, $2, 'Customer', $3)",
                [inquiryId, req.user.accountId, message]
            );
            await client.query("COMMIT");
            res.status(201).json({ inquiryId: String(inquiryId), message: "Your inquiry has been sent." });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally { client.release(); }
    } catch (error) { next(error); }
});

router.post("/:id/messages", requireAuth, async (req, res, next) => {
    try {
        const message = String(req.body.message || "").trim();
        if (!message || message.length > 4000) return res.status(422).json({ message: "A valid message is required." });

        const params = [req.params.id];
        const access = canManage(req) ? "" : " AND account_id = $2";
        if (!canManage(req)) params.push(req.user.accountId);
        const { rows } = await db.query(`SELECT inquiry_id, status FROM customer_inquiry WHERE inquiry_id = $1${access}`, params);
        if (!rows[0]) return res.status(404).json({ message: "Inquiry not found." });

        const senderRole = canManage(req) ? "Admin" : "Customer";
        await db.query(
            "INSERT INTO customer_inquiry_message (inquiry_id, sender_account_id, sender_role, message) VALUES ($1, $2, $3, $4)",
            [req.params.id, req.user.accountId, senderRole, message]
        );
        const nextStatus = canManage(req) ? "In Progress" : "Open";
        await db.query("UPDATE customer_inquiry SET status = $1, updated_at = NOW() WHERE inquiry_id = $2", [nextStatus, req.params.id]);
        res.status(201).json({ message: "Message sent.", status: nextStatus });
    } catch (error) { next(error); }
});

router.patch("/:id/status", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => {
    try {
        const status = String(req.body.status || "");
        if (!["Open", "In Progress", "Resolved", "Closed"].includes(status)) return res.status(422).json({ message: "Invalid inquiry status." });
        const result = await db.query("UPDATE customer_inquiry SET status = $1, updated_at = NOW() WHERE inquiry_id = $2", [status, req.params.id]);
        if (!result.rowCount) return res.status(404).json({ message: "Inquiry not found." });
        res.json({ status });
    } catch (error) { next(error); }
});

module.exports = router;
