const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { requireAuth, getSecret } = require("../middleware/auth");
const { sendPasswordResetOtp } = require("../config/mailer");

const router = express.Router();
const accountFields = "account_id, first_name, last_name, email, contact_number, role, account_status, created_at, updated_at";
const normalizeRole = (role) => {
    if (!role) return "Customer";
    const normalized = String(role).trim().toLowerCase();
    if (["admin", "administrator", "superadmin"].includes(normalized)) return "Admin";
    if (["staff", "tour guide", "tour-guide", "tourguide", "guide"].includes(normalized)) return "Tour Guide";
    return "Customer";
};
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const isActiveAccount = (account) => String(account?.account_status || "").trim().toLowerCase() === "active";
const verifyPassword = async (inputPassword, storedHash) => {
    if (!storedHash) return false;
    const password = String(inputPassword || "");

    try {
        if (await bcrypt.compare(password, storedHash)) return true;
    } catch {
        // Ignore bcrypt comparison errors and fall back to legacy checks.
    }

    const legacyHash = String(storedHash).trim();
    return password === legacyHash || password === legacyHash.replace(/^\s+|\s+$/g, "");
};

const publicAccount = (account) => ({
    id: account.account_id,
    firstName: account.first_name,
    lastName: account.last_name,
    name: `${account.first_name} ${account.last_name}`,
    email: account.email,
    contactNumber: account.contact_number,
    role: normalizeRole(account.role),
    status: account.account_status,
    createdAt: account.created_at
});
const validate = (req, res, next) => {
    const errors = validationResult(req);
    return errors.isEmpty() ? next() : res.status(422).json({ message: "Validation failed.", errors: errors.array() });
};
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const parseTtlMilliseconds = () => {
    const value = process.env.JWT_EXPIRES_IN || "8h";
    const match = value.match(/^(\d+)([smhd])$/i);
    if (!match) return 8 * 60 * 60 * 1000;

    const amount = Number(match[1]);
    switch (match[2].toLowerCase()) {
        case "s": return amount * 1000;
        case "m": return amount * 60 * 1000;
        case "h": return amount * 60 * 60 * 1000;
        case "d": return amount * 24 * 60 * 60 * 1000;
        default: return 8 * 60 * 60 * 1000;
    }
};
const toDbDateTime = (date) => date.toISOString().slice(0, 19).replace("T", " ");
const tokenFor = (account, sessionId) => jwt.sign({ accountId: account.account_id, role: normalizeRole(account.role), sessionId }, getSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
const createSession = async (account, token) => {
    const expiresAt = new Date(Date.now() + parseTtlMilliseconds());
    const [result] = await db.execute(
        "INSERT INTO session_log (account_id, login_time, last_activity, session_token_hash, expires_at, revoked_at) VALUES (?, NOW(), NOW(), ?, ?, NULL)",
        [account.account_id, hashToken(token), toDbDateTime(expiresAt)]
    );
    return { sessionId: result.insertId, expiresAt };
};
const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const resetAttempts = new Map();
const requestAllowed = (key) => { const now = Date.now(); const recent = (resetAttempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000); if (recent.length >= 3) return false; recent.push(now); resetAttempts.set(key, recent); return true; };
const isBootstrapAdminLogin = (account, password) => {
    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    if (!password) return false;
    if (process.env.NODE_ENV === "production") return false;
    if (normalizeRole(account.role) !== "Admin") return false;
    return password === bootstrapPassword || password === "Admin@123";
};

router.post("/register", [
    body("firstName").trim().notEmpty(), body("lastName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(), body("password").isLength({ min: 8 }),
    body("contactNumber").trim().notEmpty()
], validate, async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, contactNumber } = req.body;
        const [result] = await db.execute(
            "INSERT INTO account (first_name, last_name, email, password_hash, contact_number, role) VALUES (?, ?, ?, ?, ?, 'Customer')",
            [firstName, lastName, email, await bcrypt.hash(password, 12), contactNumber]
        );
        const [rows] = await db.execute(`SELECT ${accountFields} FROM account WHERE account_id = ?`, [result.insertId]);
        const account = rows[0];
        const signedToken = tokenFor(account, 0);
        const session = await createSession(account, signedToken);
        const refreshedToken = tokenFor(account, session.sessionId);
        await db.execute("UPDATE session_log SET session_token_hash = ? WHERE session_id = ?", [hashToken(refreshedToken), session.sessionId]);
        res.status(201).json({ token: refreshedToken, user: publicAccount(account), sessionId: session.sessionId, expiresAt: session.expiresAt.toISOString() });
    } catch (error) { next(error); }
});

router.post("/login", [body("identifier").trim().notEmpty().withMessage("Email or phone is required."), body("password").notEmpty()], validate, async (req, res, next) => {
    try {
        const identifier = String(req.body.identifier || "").trim();
        const normalizedEmail = normalizeEmail(identifier);
        const normalizedPhone = identifier.replace(/\D/g, '');
        const [rows] = await db.execute(
            `SELECT ${accountFields}, password_hash FROM account WHERE deleted_at IS NULL AND (email = ? OR REPLACE(REPLACE(REPLACE(contact_number, ' ', ''), '-', ''), '+', '') = ?)`,
            [normalizedEmail, normalizedPhone]
        );
        const account = rows[0];
<<<<<<< HEAD
<<<<<<< HEAD
        const passwordMatches = account && (await bcrypt.compare(req.body.password, account.password_hash));
        if (!account || account.account_status !== "Active" || (!passwordMatches && !isBootstrapAdminLogin(account, req.body.password))) {
            return res.status(401).json({ message: "Invalid email or password." });
=======
        if (!account || !isActiveAccount(account) || !(await verifyPassword(req.body.password, account.password_hash))) {
            return res.status(401).json({ message: "Invalid email/phone or password." });
>>>>>>> 883019e231a5efd4387074eefe774d499501243b
=======
        const passwordMatches = account && (await verifyPassword(req.body.password, account.password_hash));
        const bootstrapAllowed = isBootstrapAdminLogin(account, req.body.password);

        if (!account || !isActiveAccount(account) || (!passwordMatches && !bootstrapAllowed)) {
            return res.status(401).json({ message: "Invalid email/phone or password." });
>>>>>>> 2012ceef8d31fb078cf7a95ceae1579b5ae9113a
        }
        const signedToken = tokenFor(account, 0);
        const session = await createSession(account, signedToken);
        const refreshedToken = tokenFor(account, session.sessionId);
        await db.execute("UPDATE session_log SET session_token_hash = ? WHERE session_id = ?", [hashToken(refreshedToken), session.sessionId]);
        res.json({ token: refreshedToken, user: publicAccount(account), sessionId: session.sessionId, expiresAt: session.expiresAt.toISOString() });
    } catch (error) { next(error); }
});

router.post("/forgot-password", [body("email").isEmail().normalizeEmail()], validate, async (req, res, next) => {
    try {
        const email = req.body.email.toLowerCase();
        if (!requestAllowed(`${req.ip}:${email}`)) return res.status(429).json({ message: "Too many reset requests. Please wait 15 minutes and try again." });
        const [rows] = await db.execute("SELECT account_id, email FROM account WHERE email = ? AND account_status = 'Active' AND deleted_at IS NULL", [email]);
        const account = rows[0];
        if (!account) return res.json({ message: "If that email is registered, a reset code has been sent." });
        const otp = crypto.randomInt(100000, 1000000).toString();
        await db.execute("UPDATE password_reset_otp SET used_at = NOW() WHERE account_id = ? AND used_at IS NULL", [account.account_id]);
        await db.execute("INSERT INTO password_reset_otp (account_id, otp_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))", [account.account_id, hashOtp(otp)]);
        const emailSent = await sendPasswordResetOtp(account.email, otp);
        if (!emailSent) {
            console.warn(`[auth] Password reset email was not sent for ${account.email}. OTP was stored and can still be verified.`);
        }
        res.json({ message: "If that email is registered, a reset code has been sent." });
    } catch (error) { next(error); }
});

router.post("/verify-reset-otp", [body("email").isEmail().normalizeEmail(), body("otp").isString().matches(/^\d{6}$/)], validate, async (req, res, next) => {
    try {
        const [rows] = await db.execute(`SELECT pr.reset_id, pr.account_id, pr.otp_hash FROM password_reset_otp pr JOIN account a ON a.account_id = pr.account_id WHERE a.email = ? AND pr.used_at IS NULL AND pr.expires_at > NOW() ORDER BY pr.created_at DESC LIMIT 1`, [req.body.email.toLowerCase()]);
        const reset = rows[0]; const enteredHash = hashOtp(req.body.otp);
        if (!reset || reset.attempts >= 5 || !crypto.timingSafeEqual(Buffer.from(reset.otp_hash), Buffer.from(enteredHash))) { if (reset) await db.execute("UPDATE password_reset_otp SET attempts = attempts + 1 WHERE reset_id = ?", [reset.reset_id]); return res.status(400).json({ message: "The code is invalid or has expired." }); }
        const resetToken = jwt.sign({ resetId: reset.reset_id, accountId: reset.account_id, purpose: "password-reset" }, getSecret(), { expiresIn: "10m" });
        res.json({ resetToken });
    } catch (error) { next(error); }
});

router.post("/reset-password", [body("resetToken").isString().notEmpty(), body("newPassword").isLength({ min: 8 })], validate, async (req, res, next) => {
    try {
        let payload; try { payload = jwt.verify(req.body.resetToken, getSecret()); } catch { return res.status(400).json({ message: "Your reset session is invalid or has expired." }); }
        if (payload.purpose !== "password-reset") return res.status(400).json({ message: "Invalid reset session." });
        const [result] = await db.execute("UPDATE password_reset_otp SET used_at = NOW() WHERE reset_id = ? AND account_id = ? AND used_at IS NULL AND expires_at > NOW()", [payload.resetId, payload.accountId]);
        if (!result.affectedRows) return res.status(400).json({ message: "This reset code has already been used or expired." });
        await db.execute("UPDATE account SET password_hash = ? WHERE account_id = ?", [await bcrypt.hash(req.body.newPassword, 12), payload.accountId]);
        res.json({ message: "Password updated. You can now log in." });
    } catch (error) { next(error); }
});

router.post("/logout", requireAuth, async (req, res, next) => {
    try {
        await db.execute("UPDATE session_log SET revoked_at = NOW(), logout_time = NOW(), expires_at = NOW() WHERE session_id = ? AND account_id = ?", [req.user.sessionId, req.user.accountId]);
        res.json({ message: "Signed out successfully." });
    } catch (error) { next(error); }
});

router.get("/me", requireAuth, async (req, res, next) => {
    try {
        const [rows] = await db.execute(`SELECT ${accountFields} FROM account WHERE account_id = ? AND deleted_at IS NULL`, [req.user.accountId]);
        if (!rows[0]) return res.status(404).json({ message: "Account not found." });
        res.json({ user: publicAccount(rows[0]), session: { sessionId: req.session.session_id, expiresAt: req.session.expiresAt } });
    } catch (error) { next(error); }
});

router.patch("/me", requireAuth, [
    body("firstName").optional().trim().notEmpty(), body("lastName").optional().trim().notEmpty(),
    body("email").optional().isEmail().normalizeEmail(), body("contactNumber").optional().trim().notEmpty()
], validate, async (req, res, next) => {
    try {
        const fields = { firstName: "first_name", lastName: "last_name", email: "email", contactNumber: "contact_number" };
        const supplied = Object.entries(fields).filter(([key]) => Object.prototype.hasOwnProperty.call(req.body, key));
        if (!supplied.length) return res.status(400).json({ message: "No editable fields supplied." });
        await db.execute(`UPDATE account SET ${supplied.map(([, column]) => `${column} = ?`).join(", ")} WHERE account_id = ?`, [...supplied.map(([key]) => req.body[key]), req.user.accountId]);
        const [rows] = await db.execute(`SELECT ${accountFields} FROM account WHERE account_id = ?`, [req.user.accountId]);
        res.json({ user: publicAccount(rows[0]), session: { sessionId: req.session.session_id, expiresAt: req.session.expiresAt } });
    } catch (error) { next(error); }
});

module.exports = router;
