const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const allowedTypes = new Set(["tour", "vehicle", "destination"]);

const normalizeItem = (body = {}) => ({
    itemType: String(body.itemType || "").trim().toLowerCase(),
    itemId: Number(body.itemId),
});

router.get("/", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(`
            SELECT w.wishlist_id, w.item_type, w.item_id, w.created_at,
                   CASE WHEN w.item_type = 'tour' THEN p.package_name
                        WHEN w.item_type = 'vehicle' THEN v.vehicle_name
                        ELSE NULL END AS item_name,
                   CASE WHEN w.item_type = 'tour' THEN p.image
                        WHEN w.item_type = 'vehicle' THEN v.image
                        ELSE NULL END AS item_image
            FROM wishlist w
            LEFT JOIN tour_package p ON w.item_type = 'tour' AND p.package_id = w.item_id AND p.deleted_at IS NULL
            LEFT JOIN vehicle v ON w.item_type = 'vehicle' AND v.vehicle_id = w.item_id AND v.deleted_at IS NULL
            WHERE w.account_id = $1
            ORDER BY w.created_at DESC, w.wishlist_id DESC
        `, [req.user.accountId]);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.post("/", requireAuth, async (req, res, next) => {
    const { itemType, itemId } = normalizeItem(req.body);
    if (!allowedTypes.has(itemType) || !Number.isInteger(itemId) || itemId < 1) {
        return res.status(400).json({ message: "A valid wishlist item is required." });
    }

    try {
        const { rows } = await db.query(`
            INSERT INTO wishlist (account_id, item_type, item_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (account_id, item_type, item_id) DO UPDATE SET created_at = EXCLUDED.created_at
            RETURNING wishlist_id, item_type, item_id, created_at
        `, [req.user.accountId, itemType, itemId]);
        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

router.delete("/:itemType/:itemId", requireAuth, async (req, res, next) => {
    const itemType = String(req.params.itemType || "").trim().toLowerCase();
    const itemId = Number(req.params.itemId);
    if (!allowedTypes.has(itemType) || !Number.isInteger(itemId)) {
        return res.status(400).json({ message: "A valid wishlist item is required." });
    }

    try {
        await db.query("DELETE FROM wishlist WHERE account_id = $1 AND item_type = $2 AND item_id = $3", [req.user.accountId, itemType, itemId]);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
