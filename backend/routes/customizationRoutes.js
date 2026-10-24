const express = require("express");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();

const formatCatalog = (catalog = {}) => ({
    destinations: catalog.destinations || {},
    hotels: catalog.hotels || {},
    hotelTiers: catalog.hotelTiers || catalog.hotel_tiers || [],
});

router.get("/", async (req, res, next) => {
    try {
        const { rows } = await db.query(
            "SELECT destinations, hotels, hotel_tiers FROM customization_catalog WHERE catalog_id = 1"
        );
        const catalog = rows[0];
        res.json(formatCatalog(catalog));
    } catch (error) {
        next(error);
    }
});

router.patch("/", requireAuth, allowRoles("admin"), async (req, res, next) => {
    try {
        const destinations = req.body?.destinations || {};
        const hotels = req.body?.hotels || {};
        const hotelTiers = req.body?.hotelTiers || [];

        const { rows } = await db.query(
            `INSERT INTO customization_catalog (catalog_id, destinations, hotels, hotel_tiers, updated_by, updated_at)
             VALUES (1, $1::jsonb, $2::jsonb, $3::jsonb, $4, NOW())
             ON CONFLICT (catalog_id) DO UPDATE SET
               destinations = EXCLUDED.destinations,
               hotels = EXCLUDED.hotels,
               hotel_tiers = EXCLUDED.hotel_tiers,
               updated_by = EXCLUDED.updated_by,
               updated_at = NOW()
             RETURNING destinations, hotels, hotel_tiers`,
            [JSON.stringify(destinations), JSON.stringify(hotels), JSON.stringify(hotelTiers), req.user.accountId]
        );

        res.json(formatCatalog(rows[0]));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
