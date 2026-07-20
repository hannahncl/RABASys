const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { requireAuth, getSecret } = require("../middleware/auth");
const { sendPasswordResetOtp, sendTwoFactorOtp } = require("../config/mailer");
const { logAudit } = require("../utils/auditLogger");

const router = express.Router();
const accountFields = "account_id, first_name, last_name, email, contact_number, role, account_status, two_factor_enabled, created_at, updated_at";
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
    try {
        return await bcrypt.compare(String(inputPassword || ""), storedHash);
    } catch {
        // Invalid or legacy plaintext values are never accepted as passwords.
        return false;
    }
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
    twoFactorEnabled: Boolean(account.two_factor_enabled),
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
const sessionTtlSeconds = () => Math.max(1, Math.floor(parseTtlMilliseconds() / 1000));
const tokenFor = (account, sessionId) => jwt.sign({ accountId: account.account_id, role: normalizeRole(account.role), sessionId }, getSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
const requestMetadata = (req) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    const ipAddress = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : (req.ip || req.socket?.remoteAddress || null);
    return { ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null, userAgent: req.get("user-agent")?.slice(0, 512) || null };
};
const createSession = async (account, token, req) => {
    const { ipAddress, userAgent } = requestMetadata(req);
    const [result] = await db.execute(
        "INSERT INTO session_log (account_id, login_time, last_activity, session_token_hash, expires_at, revoked_at, ip_address, user_agent) VALUES (?, NOW(), NOW(), ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NULL, ?, ?)",
        [account.account_id, hashToken(token), sessionTtlSeconds(), ipAddress, userAgent]
    );
    const [rows] = await db.execute("SELECT expires_at FROM session_log WHERE session_id = ?", [result.insertId]);
    return { sessionId: result.insertId, expiresAt: rows[0].expires_at };
};
const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const resetAttempts = new Map();
const requestAllowed = (key) => { const now = Date.now(); const recent = (resetAttempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000); if (recent.length >= 3) return false; recent.push(now); resetAttempts.set(key, recent); return true; };
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
        const session = await createSession(account, signedToken, req);
        const refreshedToken = tokenFor(account, session.sessionId);
        await db.execute("UPDATE session_log SET session_token_hash = ? WHERE session_id = ?", [hashToken(refreshedToken), session.sessionId]);
        await logAudit({ accountId: account.account_id, sessionId: session.sessionId, action: "REGISTER", tableName: "account", recordId: account.account_id, newValues: req.body, req });
        res.status(201).json({ token: refreshedToken, user: publicAccount(account), sessionId: session.sessionId, expiresAt: new Date(session.expiresAt).toISOString() });
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
        const passwordMatches = account && (await verifyPassword(req.body.password, account.password_hash));
        
        if (!account || !isActiveAccount(account) || !(await verifyPassword(req.body.password, account.password_hash))) {
            return res.status(401).json({ message: "Invalid email/phone or password." });
        }

        if (Boolean(account.two_factor_enabled)) {
            const otp = crypto.randomInt(100000, 1000000).toString();
            await db.execute("UPDATE login_otp SET used_at = NOW() WHERE account_id = ? AND used_at IS NULL", [account.account_id]);
            await db.execute("INSERT INTO login_otp (account_id, otp_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))", [account.account_id, hashOtp(otp)]);
            await sendTwoFactorOtp(account.email, otp);
            return res.status(202).json({ requiresTwoFactor: true, message: "A verification code was sent to your email.", email: account.email });
        }

        const signedToken = tokenFor(account, 0);
        const session = await createSession(account, signedToken);
        const refreshedToken = tokenFor(account, session.sessionId);
        await db.execute("UPDATE session_log SET session_token_hash = ? WHERE session_id = ?", [hashToken(refreshedToken), session.sessionId]);
        res.json({ token: refreshedToken, user: publicAccount(account), sessionId: session.sessionId, expiresAt: session.expiresAt.toISOString() });
    } catch (error) { next(error); }
});

router.post("/verify-login-otp", [body("email").isEmail().normalizeEmail(), body("otp").isString().matches(/^\d{6}$/)], validate, async (req, res, next) => {
    try {
        const [rows] = await db.execute(`SELECT ${accountFields}, password_hash FROM account WHERE email = ? AND deleted_at IS NULL`, [req.body.email.toLowerCase()]);
        const account = rows[0];
        if (!account || !isActiveAccount(account)) return res.status(401).json({ message: "Invalid account." });

        const [otpRows] = await db.execute(`SELECT login_otp_id, otp_hash FROM login_otp WHERE account_id = ? AND used_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`, [account.account_id]);
        const loginOtp = otpRows[0];
        const enteredHash = hashOtp(req.body.otp);
        if (!loginOtp || !crypto.timingSafeEqual(Buffer.from(loginOtp.otp_hash), Buffer.from(enteredHash))) {
            return res.status(400).json({ message: "The verification code is invalid or has expired." });
        }

        await db.execute("UPDATE login_otp SET used_at = NOW() WHERE login_otp_id = ?", [loginOtp.login_otp_id]);
        const signedToken = tokenFor(account, 0);
        const session = await createSession(account, signedToken, req);
        const refreshedToken = tokenFor(account, session.sessionId);
        await db.execute("UPDATE session_log SET session_token_hash = ? WHERE session_id = ?", [hashToken(refreshedToken), session.sessionId]);
        await logAudit({ accountId: account.account_id, sessionId: session.sessionId, action: "LOGIN", tableName: "account", recordId: account.account_id, req });
        res.json({ token: refreshedToken, user: publicAccount(account), sessionId: session.sessionId, expiresAt: new Date(session.expiresAt).toISOString() });
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
        const [resetResult] = await db.execute("INSERT INTO password_reset_otp (account_id, otp_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))", [account.account_id, hashOtp(otp)]);
        await logAudit({ accountId: account.account_id, action: "PASSWORD_RESET_REQUESTED", tableName: "password_reset_otp", recordId: resetResult.insertId, req });
        const emailSent = await sendPasswordResetOtp(account.email, otp);
        if (!emailSent) {
            console.warn(`[auth] Password reset email was not sent for ${account.email}. OTP was stored and can still be verified.`);
        }
        res.json({ message: "If that email is registered, a reset code has been sent." });
    } catch (error) { next(error); }
});

router.post("/verify-reset-otp", [body("email").isEmail().normalizeEmail(), body("otp").isString().matches(/^\d{6}$/)], validate, async (req, res, next) => {
    try {
        const [rows] = await db.execute(`SELECT pr.reset_id, pr.account_id, pr.otp_hash, pr.attempts FROM password_reset_otp pr JOIN account a ON a.account_id = pr.account_id WHERE a.email = ? AND pr.used_at IS NULL AND pr.expires_at > NOW() ORDER BY pr.created_at DESC LIMIT 1`, [req.body.email.toLowerCase()]);
        const reset = rows[0]; const enteredHash = hashOtp(req.body.otp);
        if (!reset || reset.attempts >= 5 || !crypto.timingSafeEqual(Buffer.from(reset.otp_hash), Buffer.from(enteredHash))) { if (reset) await db.execute("UPDATE password_reset_otp SET attempts = attempts + 1 WHERE reset_id = ?", [reset.reset_id]); return res.status(400).json({ message: "The code is invalid or has expired." }); }
        await logAudit({ accountId: reset.account_id, action: "VERIFY_OTP", tableName: "password_reset_otp", recordId: reset.reset_id, newValues: { verified: true }, req });
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
        await db.execute("UPDATE session_log SET revoked_at = NOW(), logout_time = NOW(), expires_at = NOW() WHERE account_id = ? AND revoked_at IS NULL AND logout_time IS NULL", [payload.accountId]);
        await logAudit({ accountId: payload.accountId, action: "PASSWORD_RESET", tableName: "account", recordId: payload.accountId, newValues: { passwordChanged: true, sessionsRevoked: true }, req });
        res.json({ message: "Password updated. You can now log in." });
    } catch (error) { next(error); }
});

router.post("/logout", requireAuth, async (req, res, next) => {
    try {
        await db.execute("UPDATE session_log SET revoked_at = NOW(), logout_time = NOW(), expires_at = NOW() WHERE session_id = ? AND account_id = ?", [req.user.sessionId, req.user.accountId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "LOGOUT", tableName: "session_log", recordId: req.user.sessionId, req });
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

router.get("/sessions", requireAuth, async (req, res, next) => {
    try {
        const [rows] = await db.execute(
            `SELECT session_id, login_time, last_activity, expires_at, ip_address, user_agent,
                    session_id = ? AS current
             FROM session_log WHERE account_id = ? AND revoked_at IS NULL AND logout_time IS NULL AND expires_at > NOW()
             ORDER BY last_activity DESC`,
            [req.user.sessionId, req.user.accountId]
        );
        res.json({ sessions: rows });
    } catch (error) { next(error); }
});

router.delete("/sessions/:sessionId", requireAuth, async (req, res, next) => {
    try {
        const sessionId = Number(req.params.sessionId);
        if (!Number.isInteger(sessionId) || sessionId < 1) return res.status(422).json({ message: "Invalid session ID." });
        const [result] = await db.execute(
            "UPDATE session_log SET revoked_at = NOW(), logout_time = NOW(), expires_at = NOW() WHERE session_id = ? AND account_id = ? AND revoked_at IS NULL AND logout_time IS NULL",
            [sessionId, req.user.accountId]
        );
        if (!result.affectedRows) return res.status(404).json({ message: "Active session not found." });
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "SESSION_REVOKED", tableName: "session_log", recordId: sessionId, req });
        res.status(204).end();
    } catch (error) { next(error); }
});

router.post("/logout-all", requireAuth, async (req, res, next) => {
    try {
        await db.execute("UPDATE session_log SET revoked_at = NOW(), logout_time = NOW(), expires_at = NOW() WHERE account_id = ? AND revoked_at IS NULL AND logout_time IS NULL", [req.user.accountId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "LOGOUT_ALL", tableName: "session_log", recordId: req.user.accountId, req });
        res.json({ message: "All sessions have been signed out." });
    } catch (error) { next(error); }
});

router.patch("/me", requireAuth, [
    body("firstName").optional().trim().notEmpty(), body("lastName").optional().trim().notEmpty(),
    body("email").optional().isEmail().normalizeEmail(), body("contactNumber").optional().trim().notEmpty(),
    body("twoFactorEnabled").optional().isBoolean()
], validate, async (req, res, next) => {
    try {
        const fields = { firstName: "first_name", lastName: "last_name", email: "email", contactNumber: "contact_number", twoFactorEnabled: "two_factor_enabled" };
        const supplied = Object.entries(fields).filter(([key]) => Object.prototype.hasOwnProperty.call(req.body, key));
        if (!supplied.length) return res.status(400).json({ message: "No editable fields supplied." });
        const [before] = await db.execute(`SELECT ${accountFields} FROM account WHERE account_id = ?`, [req.user.accountId]);
        await db.execute(`UPDATE account SET ${supplied.map(([, column]) => `${column} = ?`).join(", ")} WHERE account_id = ?`, [...supplied.map(([key]) => req.body[key]), req.user.accountId]);
        const [rows] = await db.execute(`SELECT ${accountFields} FROM account WHERE account_id = ?`, [req.user.accountId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_PROFILE", tableName: "account", recordId: req.user.accountId, oldValues: before[0], newValues: rows[0], req });
        res.json({ user: publicAccount(rows[0]), session: { sessionId: req.session.session_id, expiresAt: req.session.expiresAt } });
    } catch (error) { next(error); }
});

module.exports = router;
