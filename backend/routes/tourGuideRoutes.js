const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { logAudit } = require("../utils/auditLogger");
const router = express.Router();
const hasValidPassword = (password) => typeof password === "string"
    && password.length >= 8
    && /[A-Z]/.test(password)
    && /[0-9]/.test(password);
const uploadsDirectory = path.join(__dirname, "..", "uploads", "tour-guides");
fs.mkdirSync(uploadsDirectory, { recursive: true });

const imageExtensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
};

const profilePictureUpload = multer({
    storage: multer.diskStorage({
        destination: uploadsDirectory,
        filename: (req, file, callback) => callback(null, `${req.params.id}-${crypto.randomUUID()}${imageExtensions[file.mimetype]}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!imageExtensions[file.mimetype]) return callback(new Error("Choose a JPEG, PNG, WebP, or GIF image."));
        callback(null, true);
    },
}).single("profilePicture");

const handleProfilePictureUpload = (req, res, next) => {
    profilePictureUpload(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "Profile pictures must be 5 MB or smaller." });
        }
        if (error.message.startsWith("Choose a JPEG")) {
            return res.status(422).json({ message: error.message });
        }
        next(error);
    });
};

// Full JOIN query to get both account + tour_guide data
const guideSelect = `
    SELECT 
        a.account_id, a.first_name, a.last_name, a.email, a.contact_number,
        a.role, a.account_status, a.created_at,
        tg.guide_id, tg.media_id, m.file_path AS profile_picture,
        tg.sex, tg.birthdate, tg.years_of_experience,
        tg.description, tg.languages_spoken, tg.availability_status, tg.employment_status
    FROM account a
    LEFT JOIN tour_guide tg ON tg.account_id = a.account_id
    LEFT JOIN media m ON m.media_id = tg.media_id
    WHERE a.role = 'Tour Guide' AND a.deleted_at IS NULL
`;

const formatGuide = (row) => ({
    id: String(row.account_id),
    guideId: row.guide_id ? String(row.guide_id) : null,
    firstName: row.first_name,
    lastName: row.last_name,
    name: `${row.first_name} ${row.last_name}`,
    email: row.email,
    phone: row.contact_number,
    role: 'tour-guide',
    status: row.account_status,
    sex: row.sex || '',
    birthDate: row.birthdate ? row.birthdate.toISOString?.().slice(0, 10) ?? String(row.birthdate).slice(0, 10) : '',
    yearsExperience: row.years_of_experience ?? '',
    description: row.description || '',
    languageSpoken: row.languages_spoken || '',
    availability: row.availability_status || 'Available',
    employmentStatus: row.employment_status || 'Active',
    profilePicture: row.profile_picture || '',
    createdAt: row.created_at,
});

// GET active tour guides for public About Us page (no auth required)
router.get("/about", async (req, res, next) => {
    try {
        const { rows } = await db.query(`${guideSelect} AND tg.availability_status = 'Available' AND tg.employment_status = 'Active' AND a.account_status = 'Active' ORDER BY tg.years_of_experience DESC`);
        res.json(rows.map(row => ({
            id: String(row.account_id),
            guideId: String(row.guide_id),
            firstName: row.first_name,
            lastName: row.last_name,
            name: `${row.first_name} ${row.last_name}`,
            yearsExperience: row.years_of_experience ?? 0,
            description: row.description || '',
            languageSpoken: row.languages_spoken || '',
            profilePicture: row.profile_picture || '',
        })));
    } catch (e) { next(e); }
});

// GET all tour guides
router.get("/", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => {
    try {
        const { rows } = await db.query(`${guideSelect} ORDER BY a.account_id DESC`);
        res.json(rows.map(formatGuide));
    } catch (e) { next(e); }
});

// GET all available tour guides (Public for booking interface)
router.get("/public", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(`${guideSelect} AND tg.availability_status = 'Available' ORDER BY a.account_id DESC`);
        res.json(rows.map(formatGuide));
    } catch (e) { next(e); }
});

// GET single tour guide
router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Tour guide not found." });
        res.json(formatGuide(rows[0]));
    } catch (e) { next(e); }
});

router.post("/:id/profile-picture", requireAuth, allowRoles("Admin"), handleProfilePictureUpload, async (req, res, next) => {
    if (!req.file) return res.status(422).json({ message: "Choose a profile picture to upload." });

    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const { rows: guideRows } = await client.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        if (!guideRows[0]) {
            await client.query("ROLLBACK");
            await fs.promises.unlink(req.file.path);
            return res.status(404).json({ message: "Tour guide not found." });
        }

        const profilePicturePath = `/uploads/tour-guides/${req.file.filename}`;
        let mediaId = guideRows[0].media_id;
        if (mediaId) {
            await client.query("UPDATE media SET file_path = $1, media_type = 'Image' WHERE media_id = $2", [profilePicturePath, mediaId]);
        } else {
            const { rows: mediaRows } = await client.query(
                "INSERT INTO media (file_path, media_type, uploaded_by, title) VALUES ($1, 'Image', $2, $3) RETURNING media_id",
                [profilePicturePath, req.user.accountId, `${guideRows[0].first_name} ${guideRows[0].last_name} profile picture`]
            );
            mediaId = mediaRows[0].media_id;
        }
        await client.query("UPDATE tour_guide SET media_id = $1 WHERE account_id = $2", [mediaId, req.params.id]);
        await client.query("COMMIT");

        res.json({ profilePicture: profilePicturePath });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        await fs.promises.unlink(req.file.path).catch(() => {});
        next(error);
    } finally {
        client.release();
    }
});

// POST create tour guide — creates account + tour_guide profile in a transaction
router.post("/", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    const client = await db.connect();
    let transactionCommitted = false;
    try {
        await client.query("BEGIN");

        const { firstName, lastName, email, password, contactNumber, sex, birthDate, yearsExperience, description, languageSpoken } = req.body;

        if (!firstName || !lastName || !email || !password || !contactNumber) {
            await client.query("ROLLBACK");
            return res.status(422).json({ message: "firstName, lastName, email, password, and contactNumber are required." });
        }

        // Generate a temporary password — admin should inform the guide to reset it
        if (!hasValidPassword(password)) {
            await client.query("ROLLBACK");
            return res.status(422).json({ message: "Password must be at least 8 characters and include one uppercase letter and one number." });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const { rows: accountRows } = await client.query(
            "INSERT INTO account (first_name, last_name, email, password_hash, contact_number, role, account_status) VALUES ($1, $2, $3, $4, $5, 'Tour Guide', 'Active') RETURNING account_id",
            [firstName, lastName, email, passwordHash, contactNumber]
        );
        const accountId = accountRows[0].account_id;

        // Insert tour_guide profile
        await client.query(
            `INSERT INTO tour_guide (account_id, sex, birthdate, years_of_experience, description, languages_spoken, availability_status, employment_status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'Available', 'Active')`,
            [accountId, sex || 'Male', birthDate || null, yearsExperience || 0, description || null, languageSpoken || null]
        );

        await client.query("COMMIT");
        transactionCommitted = true;

        const { rows } = await db.query(`${guideSelect} AND a.account_id = $1`, [accountId]);
        try {
            await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "CREATE", tableName: "tour_guide", recordId: accountId, newValues: rows[0], req });
        } catch (auditError) {
            // The guide is already committed; an audit-table issue must not make
            // the client treat the successful create as a failed request.
            console.error("Failed to write tour guide creation audit record:", auditError);
        }
        res.status(201).json(formatGuide(rows[0]));
    } catch (e) {
        if (!transactionCommitted) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // Preserve the original error; the client is released in finally.
            }
        }
        next(e);
    } finally {
        client.release();
    }
});

// PATCH update tour guide (both account + tour_guide profile)
router.patch("/:id", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    const client = await db.connect();
    let transactionCommitted = false;
    try {
        await client.query("BEGIN");
        const { rows: beforeRows } = await client.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        const { firstName, lastName, email, contactNumber, sex, birthDate, yearsExperience, description, languageSpoken } = req.body;

        // Update account fields
        await client.query(
            "UPDATE account SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), email = COALESCE($3, email), contact_number = COALESCE($4, contact_number) WHERE account_id = $5",
            [firstName || null, lastName || null, email || null, contactNumber || null, req.params.id]
        );

        // Update tour_guide profile
        await client.query(
            `UPDATE tour_guide SET 
                sex = COALESCE($1, sex),
                birthdate = COALESCE($2, birthdate),
                years_of_experience = COALESCE($3, years_of_experience),
                description = COALESCE($4, description),
                languages_spoken = COALESCE($5, languages_spoken)
             WHERE account_id = $6`,
            [sex || null, birthDate || null, yearsExperience ?? null, description || null, languageSpoken || null, req.params.id]
        );

        await client.query("COMMIT");
        transactionCommitted = true;

        const { rows } = await db.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Tour guide not found." });
        try {
            await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE", tableName: "tour_guide", recordId: req.params.id, oldValues: beforeRows[0], newValues: rows[0], req });
        } catch (auditError) {
            // The profile update is already committed; keep the client moving
            // so any selected profile photo can be uploaded as the next step.
            console.error("Failed to write tour guide update audit record:", auditError);
        }
        res.json(formatGuide(rows[0]));
    } catch (e) {
        if (!transactionCommitted) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // Preserve the original error; the client is released in finally.
            }
        }
        next(e);
    } finally {
        client.release();
    }
});

// PATCH toggle account status (Active/Inactive)
router.patch("/:id/status", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const { rows: before } = await db.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        await db.query(
            "UPDATE account SET account_status = CASE WHEN account_status = 'Active' THEN 'Inactive' ELSE 'Active' END WHERE account_id = $1 AND deleted_at IS NULL",
            [req.params.id]
        );
        const { rows } = await db.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_STATUS", tableName: "tour_guide", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req });
        res.json(formatGuide(rows[0]));
    } catch (e) { next(e); }
});

// PATCH toggle availability_status
router.patch("/:id/availability", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const { rows: before } = await db.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        await db.query(
            "UPDATE tour_guide SET availability_status = CASE WHEN availability_status = 'Available' THEN 'Unavailable' ELSE 'Available' END WHERE account_id = $1",
            [req.params.id]
        );
        const { rows } = await db.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_AVAILABILITY", tableName: "tour_guide", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req });
        res.json(formatGuide(rows[0]));
    } catch (e) { next(e); }
});

// PATCH toggle employment_status
router.patch("/:id/employment", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const { rows: before } = await db.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        await db.query(
            "UPDATE tour_guide SET employment_status = CASE WHEN employment_status = 'Active' THEN 'Inactive' ELSE 'Active' END WHERE account_id = $1",
            [req.params.id]
        );
        const { rows } = await db.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_EMPLOYMENT", tableName: "tour_guide", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req });
        res.json(formatGuide(rows[0]));
    } catch (e) { next(e); }
});

// DELETE soft-delete tour guide account
router.delete("/:id", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const { rows: before } = await db.query(`${guideSelect} AND a.account_id = $1`, [req.params.id]);
        const result = await db.query(
            "UPDATE account SET deleted_at = NOW() WHERE account_id = $1 AND deleted_at IS NULL AND role = 'Tour Guide'",
            [req.params.id]
        );
        if (!result.rowCount) return res.status(404).json({ message: "Tour guide not found." });
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "DELETE", tableName: "tour_guide", recordId: req.params.id, oldValues: before[0], req });
        res.status(204).end();
    } catch (e) { next(e); }
});

module.exports = router;
