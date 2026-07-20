const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { logAudit } = require("../utils/auditLogger");
const router = express.Router();

// Full JOIN query to get both account + tour_guide data
const guideSelect = `
    SELECT 
        a.account_id, a.first_name, a.last_name, a.email, a.contact_number,
        a.role, a.account_status, a.created_at,
        tg.guide_id, tg.sex, tg.birthdate, tg.years_of_experience,
        tg.description, tg.languages_spoken, tg.availability_status, tg.employment_status
    FROM account a
    LEFT JOIN tour_guide tg ON tg.account_id = a.account_id
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
    createdAt: row.created_at,
});

// GET all tour guides
router.get("/", requireAuth, allowRoles("Admin", "Tour Guide"), async (req, res, next) => {
    try {
        const [rows] = await db.query(`${guideSelect} ORDER BY a.account_id DESC`);
        res.json(rows.map(formatGuide));
    } catch (e) { next(e); }
});

// GET single tour guide
router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        const [rows] = await db.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Tour guide not found." });
        res.json(formatGuide(rows[0]));
    } catch (e) { next(e); }
});

// POST create tour guide — creates account + tour_guide profile in a transaction
router.post("/", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { firstName, lastName, email, contactNumber, sex, birthDate, yearsExperience, description, languageSpoken } = req.body;

        if (!firstName || !lastName || !email || !contactNumber) {
            await conn.rollback();
            conn.release();
            return res.status(422).json({ message: "firstName, lastName, email, and contactNumber are required." });
        }

        // Generate a temporary password — admin should inform the guide to reset it
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const [accountResult] = await conn.execute(
            "INSERT INTO account (first_name, last_name, email, password_hash, contact_number, role, account_status) VALUES (?, ?, ?, ?, ?, 'Tour Guide', 'Active')",
            [firstName, lastName, email, passwordHash, contactNumber]
        );
        const accountId = accountResult.insertId;

        // Insert tour_guide profile
        await conn.execute(
            `INSERT INTO tour_guide (account_id, sex, birthdate, years_of_experience, description, languages_spoken, availability_status, employment_status) 
             VALUES (?, ?, ?, ?, ?, ?, 'Available', 'Active')`,
            [accountId, sex || 'Male', birthDate || null, yearsExperience || 0, description || null, languageSpoken || null]
        );

        await conn.commit();
        conn.release();

        const [rows] = await db.execute(`${guideSelect} AND a.account_id = ?`, [accountId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "CREATE", tableName: "tour_guide", recordId: accountId, newValues: rows[0], req });
        res.status(201).json({ ...formatGuide(rows[0]), tempPassword });
    } catch (e) {
        await conn.rollback();
        conn.release();
        next(e);
    }
});

// PATCH update tour guide (both account + tour_guide profile)
router.patch("/:id", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [beforeRows] = await conn.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        const { firstName, lastName, email, contactNumber, sex, birthDate, yearsExperience, description, languageSpoken } = req.body;

        // Update account fields
        await conn.execute(
            "UPDATE account SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), contact_number = COALESCE(?, contact_number) WHERE account_id = ?",
            [firstName || null, lastName || null, email || null, contactNumber || null, req.params.id]
        );

        // Update tour_guide profile
        await conn.execute(
            `UPDATE tour_guide SET 
                sex = COALESCE(?, sex), 
                birthdate = COALESCE(?, birthdate),
                years_of_experience = COALESCE(?, years_of_experience),
                description = COALESCE(?, description),
                languages_spoken = COALESCE(?, languages_spoken)
             WHERE account_id = ?`,
            [sex || null, birthDate || null, yearsExperience ?? null, description || null, languageSpoken || null, req.params.id]
        );

        await conn.commit();
        conn.release();

        const [rows] = await db.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Tour guide not found." });
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE", tableName: "tour_guide", recordId: req.params.id, oldValues: beforeRows[0], newValues: rows[0], req });
        res.json(formatGuide(rows[0]));
    } catch (e) {
        await conn.rollback();
        conn.release();
        next(e);
    }
});

// PATCH toggle account status (Active/Inactive)
router.patch("/:id/status", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const [before] = await db.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        await db.execute(
            "UPDATE account SET account_status = CASE WHEN account_status = 'Active' THEN 'Inactive' ELSE 'Active' END WHERE account_id = ? AND deleted_at IS NULL",
            [req.params.id]
        );
        const [rows] = await db.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_STATUS", tableName: "tour_guide", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req });
        res.json(formatGuide(rows[0]));
    } catch (e) { next(e); }
});

// PATCH toggle availability_status
router.patch("/:id/availability", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const [before] = await db.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        await db.execute(
            "UPDATE tour_guide SET availability_status = CASE WHEN availability_status = 'Available' THEN 'Unavailable' ELSE 'Available' END WHERE account_id = ?",
            [req.params.id]
        );
        const [rows] = await db.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_AVAILABILITY", tableName: "tour_guide", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req });
        res.json(formatGuide(rows[0]));
    } catch (e) { next(e); }
});

// PATCH toggle employment_status
router.patch("/:id/employment", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const [before] = await db.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        await db.execute(
            "UPDATE tour_guide SET employment_status = CASE WHEN employment_status = 'Active' THEN 'Inactive' ELSE 'Active' END WHERE account_id = ?",
            [req.params.id]
        );
        const [rows] = await db.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_EMPLOYMENT", tableName: "tour_guide", recordId: req.params.id, oldValues: before[0], newValues: rows[0], req });
        res.json(formatGuide(rows[0]));
    } catch (e) { next(e); }
});

// DELETE soft-delete tour guide account
router.delete("/:id", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const [before] = await db.execute(`${guideSelect} AND a.account_id = ?`, [req.params.id]);
        const [result] = await db.execute(
            "UPDATE account SET deleted_at = NOW() WHERE account_id = ? AND deleted_at IS NULL AND role = 'Tour Guide'",
            [req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ message: "Tour guide not found." });
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "DELETE", tableName: "tour_guide", recordId: req.params.id, oldValues: before[0], req });
        res.status(204).end();
    } catch (e) { next(e); }
});

module.exports = router;
