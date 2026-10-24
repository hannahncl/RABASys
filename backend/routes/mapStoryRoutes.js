const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const MAX_IMAGE_DATA_URL_LENGTH = 11 * 1024 * 1024;
const defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

const mapStorySelect = `
    SELECT s.story_id::text AS id,
           s.spot_id AS "spotId",
           s.tourist_name AS "touristName",
           s.caption,
           s.image_url AS "imageUrl",
           s.created_at AS date,
           s.account_id::text AS "ownerId",
           a.email AS "ownerEmail",
           COALESCE(a.profile_picture, '${defaultAvatar}') AS avatar,
           (SELECT COUNT(*)::int FROM map_story_like l WHERE l.story_id = s.story_id) AS "likesCount",
           ($1::integer IS NOT NULL AND EXISTS (
               SELECT 1 FROM map_story_like l
               WHERE l.story_id = s.story_id AND l.account_id = $1
           )) AS "isLiked"
    FROM map_story s
    JOIN account a ON a.account_id = s.account_id
`;

function optionalAuth(req, res, next) {
    return req.headers.authorization ? requireAuth(req, res, next) : next();
}

function validImageUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;
    const imageUrl = value.trim();
    if (imageUrl.startsWith("data:")) {
        return imageUrl.length <= MAX_IMAGE_DATA_URL_LENGTH
            && /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(imageUrl);
    }

    if (imageUrl.length > 2048) return false;
    try {
        const parsed = new URL(imageUrl);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function validStoryId(value) {
    return /^\d+$/.test(String(value));
}

async function findStory(storyId, accountId) {
    const { rows } = await db.query(`${mapStorySelect} WHERE s.story_id = $2`, [accountId || null, storyId]);
    return rows[0] || null;
}

router.get("/mine", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `${mapStorySelect} WHERE s.account_id = $2 ORDER BY s.created_at DESC`,
            [req.user.accountId, req.user.accountId]
        );
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.get("/", optionalAuth, async (req, res, next) => {
    try {
        const spotId = String(req.query.spotId || "").trim() || null;
        const { rows } = await db.query(
            `${mapStorySelect}
             WHERE ($2::varchar IS NULL OR s.spot_id = $2)
             ORDER BY s.created_at DESC`,
            [req.user?.accountId || null, spotId]
        );
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.post("/", requireAuth, async (req, res, next) => {
    try {
        const spotId = String(req.body.spotId || "").trim();
        const touristName = String(req.body.touristName || "").trim();
        const caption = String(req.body.caption || "").trim();
        const imageUrl = typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : "";

        if (!spotId || spotId.length > 180) {
            return res.status(422).json({ message: "Choose a valid destination spot." });
        }
        if (!touristName || touristName.length > 120) {
            return res.status(422).json({ message: "Your name must be 120 characters or fewer." });
        }
        if (!caption || caption.length > 500) {
            return res.status(422).json({ message: "Caption is required and must be 500 characters or fewer." });
        }
        if (!validImageUrl(imageUrl)) {
            return res.status(422).json({ message: "Choose a valid image. Uploaded image files must be 8 MB or smaller." });
        }

        const { rows: bookings } = await db.query(
            "SELECT 1 FROM booking WHERE account_id = $1 AND deleted_at IS NULL LIMIT 1",
            [req.user.accountId]
        );
        if (!bookings[0]) {
            return res.status(403).json({ message: "Book a tour package before sharing photos." });
        }

        const { rows: inserted } = await db.query(
            `INSERT INTO map_story (account_id, spot_id, tourist_name, caption, image_url)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING story_id`,
            [req.user.accountId, spotId, touristName, caption, imageUrl]
        );
        const story = await findStory(inserted[0].story_id, req.user.accountId);
        res.status(201).json(story);
    } catch (error) {
        next(error);
    }
});

router.patch("/:id/caption", requireAuth, async (req, res, next) => {
    try {
        if (!validStoryId(req.params.id)) return res.status(404).json({ message: "Photo not found." });
        const caption = String(req.body.caption || "").trim();
        if (!caption || caption.length > 500) {
            return res.status(422).json({ message: "Caption is required and must be 500 characters or fewer." });
        }

        const { rows } = await db.query(
            `UPDATE map_story SET caption = $1
             WHERE story_id = $2 AND account_id = $3
             RETURNING story_id`,
            [caption, req.params.id, req.user.accountId]
        );
        if (!rows[0]) return res.status(404).json({ message: "Photo not found." });

        res.json(await findStory(rows[0].story_id, req.user.accountId));
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
    try {
        if (!validStoryId(req.params.id)) return res.status(404).json({ message: "Photo not found." });
        const { rowCount } = await db.query(
            "DELETE FROM map_story WHERE story_id = $1 AND account_id = $2",
            [req.params.id, req.user.accountId]
        );
        if (!rowCount) return res.status(404).json({ message: "Photo not found." });
        res.json({ deleted: true });
    } catch (error) {
        next(error);
    }
});

router.post("/:id/like", requireAuth, async (req, res, next) => {
    let client;
    try {
        if (!validStoryId(req.params.id)) return res.status(404).json({ message: "Photo not found." });
        client = await db.connect();
        await client.query("BEGIN");
        const { rows: stories } = await client.query(
            "SELECT story_id FROM map_story WHERE story_id = $1 FOR UPDATE",
            [req.params.id]
        );
        if (!stories[0]) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Photo not found." });
        }

        const { rows: existing } = await client.query(
            "SELECT 1 FROM map_story_like WHERE story_id = $1 AND account_id = $2",
            [req.params.id, req.user.accountId]
        );
        const isLiked = !existing[0];
        if (isLiked) {
            await client.query(
                "INSERT INTO map_story_like (story_id, account_id) VALUES ($1, $2)",
                [req.params.id, req.user.accountId]
            );
        } else {
            await client.query(
                "DELETE FROM map_story_like WHERE story_id = $1 AND account_id = $2",
                [req.params.id, req.user.accountId]
            );
        }
        const { rows: [counts] } = await client.query(
            "SELECT COUNT(*)::int AS likes_count FROM map_story_like WHERE story_id = $1",
            [req.params.id]
        );
        await client.query("COMMIT");
        res.json({
            id: String(req.params.id),
            isLiked,
            likesCount: counts.likes_count,
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Failed to roll back map photo like:", rollbackError.message);
            }
        }
        next(error);
    } finally {
        client?.release();
    }
});

module.exports = router;
