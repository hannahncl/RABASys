const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/unread", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            "SELECT * FROM notification WHERE account_id = $1 AND is_read = 0 ORDER BY sent_at IS NULL DESC, sent_at DESC, notification_id DESC LIMIT 50",
            [req.user.accountId]
        );
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.get("/", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            "SELECT * FROM notification WHERE account_id = $1 ORDER BY sent_at IS NULL DESC, sent_at DESC, notification_id DESC LIMIT 50",
            [req.user.accountId]
        );
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.patch("/read-all", requireAuth, async (req, res, next) => {
    try {
        await db.query(
            "UPDATE notification SET is_read = 1 WHERE account_id = $1 AND is_read = 0",
            [req.user.accountId]
        );
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
});

router.patch("/:id/read", requireAuth, async (req, res, next) => {
    try {
        const result = await db.query(
            "UPDATE notification SET is_read = 1 WHERE notification_id = $1 AND account_id = $2",
            [req.params.id, req.user.accountId]
        );
        if (!result.rowCount) return res.status(404).json({ message: "Notification not found." });
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
