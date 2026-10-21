const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");
const db = require("../config/db");
const { requireAuth, getSecret } = require("../middleware/auth");
const { sendPasswordResetOtp, sendTwoFactorOtp } = require("../config/mailer");
const { logAudit } = require("../utils/auditLogger");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const accountFields = "account_id, first_name, last_name, email, contact_number, role, account_status, two_factor_enabled, google_id, created_at, updated_at";
const accountSelect = `
    SELECT 
        a.account_id, a.first_name, a.last_name, a.email, a.contact_number, 
        a.role, a.account_status, a.two_factor_enabled, a.google_id, a.created_at, a.updated_at,
        m.file_path AS profile_picture
    FROM account a
    LEFT JOIN tour_guide tg ON tg.account_id = a.account_id
    LEFT JOIN media m ON m.media_id = tg.media_id
`;
const accountSelectWithPassword = `
    SELECT 
        a.account_id, a.first_name, a.last_name, a.email, a.contact_number, 
        a.role, a.account_status, a.two_factor_enabled, a.google_id, a.created_at, a.updated_at,
        a.password_hash,
        m.file_path AS profile_picture
    FROM account a
    LEFT JOIN tour_guide tg ON tg.account_id = a.account_id
    LEFT JOIN media m ON m.media_id = tg.media_id
`;

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
    if (storedHash === inputPassword) return true;
    try {
        if (await bcrypt.compare(String(inputPassword || ""), storedHash)) return true;
    } catch {
        // Fall through to plaintext comparison for legacy or manually inserted records
    }
    return storedHash === inputPassword;
};

const publicAccount = (account) => ({
    id: account.account_id,
    firstName: account.first_name,
    lastName: account.last_name || "",
    name: [account.first_name, account.last_name].filter(Boolean).join(" "),
    email: account.email,
    contactNumber: account.contact_number,
    role: normalizeRole(account.role),
    status: account.account_status,
    twoFactorEnabled: Boolean(account.two_factor_enabled),
    profilePicture: account.profile_picture || account.profilePicture || "",
    createdAt: account.created_at
});
const validate = (req, res, next) => {
    const errors = validationResult(req);
    return errors.isEmpty() ? next() : res.status(422).json({ message: "Validation failed.", errors: errors.array() });
};
const sanitizeText = (value) => String(value ?? "").trim().replace(/[\u0000-\u001F\u007F]/g, "").replace(/[<>]/g, "");
const sanitizeEmail = (email) => sanitizeText(email).toLowerCase();
const logAuditEvent = async (accountId, action, detail = "", req = null) => {
    try {
        await logAudit({ accountId: accountId ?? null, action: String(action).toUpperCase(), tableName: "account", newValues: detail ? { detail } : null, req });
    } catch (error) {
        console.warn(`[auth] Audit logging failed for ${action}:`, error.message);
    }
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
    // Single INSERT ... RETURNING eliminates the need for a second SELECT.
    const { rows } = await db.query(
        "INSERT INTO session_log (account_id, login_time, last_activity, session_token_hash, expires_at, revoked_at, ip_address, user_agent) VALUES ($1, NOW(), NOW(), $2, NOW() + ($3 * INTERVAL '1 second'), NULL, $4, $5) RETURNING session_id, expires_at",
        [account.account_id, hashToken(token), sessionTtlSeconds(), ipAddress, userAgent]
    );
    return { sessionId: rows[0].session_id, expiresAt: rows[0].expires_at };
};
const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const resetAttempts = new Map();
const requestAllowed = (key) => { const now = Date.now(); const recent = (resetAttempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000); if (recent.length >= 3) return false; recent.push(now); resetAttempts.set(key, recent); return true; };
router.post("/register", [
    body("firstName").trim().isLength({ min: 1, max: 100 }).matches(/^[A-Za-z\s.'-]+$/),
    body("lastName").trim().isLength({ min: 1, max: 100 }).matches(/^[A-Za-z\s.'-]+$/),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
    body("contactNumber").trim().isLength({ min: 10, max: 15 }).matches(/^[0-9+\-()\s]+$/)
], validate, async (req, res, next) => {
    try {
        const firstName = sanitizeText(req.body.firstName);
        const lastName = sanitizeText(req.body.lastName);
        const email = sanitizeEmail(req.body.email);
        const password = sanitizeText(req.body.password);
        const contactNumber = sanitizeText(req.body.contactNumber);
        const { rows: inserted } = await db.query(
            "INSERT INTO account (first_name, last_name, email, password_hash, contact_number, role) VALUES ($1, $2, $3, $4, $5, 'Customer') RETURNING account_id",
            [firstName, lastName, email, await bcrypt.hash(password, 12), contactNumber]
        );
        const { rows } = await db.query(`SELECT ${accountFields} FROM account WHERE account_id = $1`, [inserted[0].account_id]);
        const account = rows[0];
        const signedToken = tokenFor(account, 0);
        const session = await createSession(account, signedToken, req);
        const refreshedToken = tokenFor(account, session.sessionId);
        await db.query("UPDATE session_log SET session_token_hash = $1 WHERE session_id = $2", [hashToken(refreshedToken), session.sessionId]);
        await logAudit({ accountId: account.account_id, sessionId: session.sessionId, action: "REGISTER", tableName: "account", recordId: account.account_id, newValues: req.body, req });
        res.status(201).json({ token: refreshedToken, user: publicAccount(account), sessionId: session.sessionId, expiresAt: new Date(session.expiresAt).toISOString() });
    } catch (error) { next(error); }
});

router.post("/login", [body("identifier").trim().isLength({ min: 1, max: 120 }).withMessage("Email or phone is required."), body("password").isLength({ min: 1, max: 200 })], validate, async (req, res, next) => {
    try {
        const identifier = sanitizeText(req.body.identifier);
        const password = sanitizeText(req.body.password);
        const normalizedEmail = normalizeEmail(identifier);
        const normalizedPhone = identifier.replace(/\D/g, '');
        const { rows } = await db.query(
            `SELECT ${accountFields}, password_hash FROM account WHERE deleted_at IS NULL AND (email = $1 OR REPLACE(REPLACE(REPLACE(contact_number, ' ', ''), '-', ''), '+', '') = $2)`,
            [normalizedEmail, normalizedPhone]
        );
        const account = rows[0];
        const passwordMatches = account && (await verifyPassword(req.body.password, account.password_hash));
        if (!account || !isActiveAccount(account) || !passwordMatches) {
            return res.status(401).json({ message: "Invalid email/phone or password." });
        }

        if (account.password_hash === req.body.password) {
            try {
                const newHash = await bcrypt.hash(req.body.password, 12);
                await db.query("UPDATE account SET password_hash = $1 WHERE account_id = $2", [newHash, account.account_id]);
                account.password_hash = newHash;
            } catch (err) {
                console.warn("[auth] Failed to auto-hash plaintext password:", err.message);
            }
        }

        const signedToken = tokenFor(account, 0);
        const session = await createSession(account, signedToken, req);
        const refreshedToken = tokenFor(account, session.sessionId);
        await db.query("UPDATE session_log SET session_token_hash = $1 WHERE session_id = $2", [hashToken(refreshedToken), session.sessionId]);
        res.json({ token: refreshedToken, user: publicAccount(account), sessionId: session.sessionId, expiresAt: session.expiresAt.toISOString() });
    } catch (error) { next(error); }
});

router.post("/verify-login-otp", [body("email").isEmail().normalizeEmail(), body("otp").isString().matches(/^\d{6}$/)], validate, async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT ${accountFields}, password_hash FROM account WHERE email = $1 AND deleted_at IS NULL`, [req.body.email.toLowerCase()]);
        const account = rows[0];
        if (!account || !isActiveAccount(account)) return res.status(401).json({ message: "Invalid account." });

        const { rows: otpRows } = await db.query(`SELECT login_otp_id, otp_hash FROM login_otp WHERE account_id = $1 AND used_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`, [account.account_id]);
        const loginOtp = otpRows[0];
        const enteredHash = hashOtp(req.body.otp);
        if (!loginOtp || !crypto.timingSafeEqual(Buffer.from(loginOtp.otp_hash), Buffer.from(enteredHash))) {
            return res.status(400).json({ message: "The verification code is invalid or has expired." });
        }

        await db.query("UPDATE login_otp SET used_at = NOW() WHERE login_otp_id = $1", [loginOtp.login_otp_id]);
        const signedToken = tokenFor(account, 0);
        const session = await createSession(account, signedToken, req);
        const refreshedToken = tokenFor(account, session.sessionId);
        await db.query("UPDATE session_log SET session_token_hash = $1 WHERE session_id = $2", [hashToken(refreshedToken), session.sessionId]);
        await logAudit({ accountId: account.account_id, sessionId: session.sessionId, action: "LOGIN", tableName: "account", recordId: account.account_id, req });
        res.json({ token: refreshedToken, user: publicAccount(account), sessionId: session.sessionId, expiresAt: new Date(session.expiresAt).toISOString() });
    } catch (error) { next(error); }
});

router.post("/forgot-password", [body("email").isEmail().normalizeEmail()], validate, async (req, res, next) => {
    try {
        const email = req.body.email.toLowerCase();
        if (!requestAllowed(`${req.ip}:${email}`)) return res.status(429).json({ message: "Too many reset requests. Please wait 15 minutes and try again." });
        const { rows } = await db.query("SELECT account_id, email FROM account WHERE email = $1 AND account_status = 'Active' AND deleted_at IS NULL", [email]);
        const account = rows[0];
        if (!account) return res.json({ message: "If that email is registered, a reset code has been sent." });
        const otp = crypto.randomInt(100000, 1000000).toString();
        await db.query("UPDATE password_reset_otp SET used_at = NOW() WHERE account_id = $1 AND used_at IS NULL", [account.account_id]);
        const { rows: rr } = await db.query("INSERT INTO password_reset_otp (account_id, otp_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes') RETURNING reset_id", [account.account_id, hashOtp(otp)]);
        await logAudit({ accountId: account.account_id, action: "PASSWORD_RESET_REQUESTED", tableName: "password_reset_otp", recordId: rr[0].reset_id, req });
        const emailSent = await sendPasswordResetOtp(account.email, otp);
        if (!emailSent) {
            console.warn(`[auth] Password reset email was not sent for ${account.email}. OTP was stored and can still be verified.`);
        }
        await logAuditEvent(account.account_id, "password_reset_requested", `Password reset requested for ${account.email}`);
        res.json({ message: "If that email is registered, a reset code has been sent." });
    } catch (error) { next(error); }
});

router.post("/verify-reset-otp", [body("email").isEmail().normalizeEmail(), body("otp").isString().matches(/^\d{6}$/)], validate, async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT pr.reset_id, pr.account_id, pr.otp_hash, pr.attempts FROM password_reset_otp pr JOIN account a ON a.account_id = pr.account_id WHERE a.email = $1 AND pr.used_at IS NULL AND pr.expires_at > NOW() ORDER BY pr.created_at DESC LIMIT 1`, [req.body.email.toLowerCase()]);
        const reset = rows[0]; const enteredHash = hashOtp(req.body.otp);
        if (!reset || reset.attempts >= 5 || !crypto.timingSafeEqual(Buffer.from(reset.otp_hash), Buffer.from(enteredHash))) { if (reset) await db.query("UPDATE password_reset_otp SET attempts = attempts + 1 WHERE reset_id = $1", [reset.reset_id]); return res.status(400).json({ message: "The code is invalid or has expired." }); }
        await logAudit({ accountId: reset.account_id, action: "VERIFY_OTP", tableName: "password_reset_otp", recordId: reset.reset_id, newValues: { verified: true }, req });
        const resetToken = jwt.sign({ resetId: reset.reset_id, accountId: reset.account_id, purpose: "password-reset" }, getSecret(), { expiresIn: "10m" });
        res.json({ resetToken });
    } catch (error) { next(error); }
});

router.post("/reset-password", [body("resetToken").isString().notEmpty(), body("newPassword").isLength({ min: 8 })], validate, async (req, res, next) => {
    try {
        let payload; try { payload = jwt.verify(req.body.resetToken, getSecret()); } catch { return res.status(400).json({ message: "Your reset session is invalid or has expired." }); }
        if (payload.purpose !== "password-reset") return res.status(400).json({ message: "Invalid reset session." });
        const result = await db.query("UPDATE password_reset_otp SET used_at = NOW() WHERE reset_id = $1 AND account_id = $2 AND used_at IS NULL AND expires_at > NOW()", [payload.resetId, payload.accountId]);
        if (!result.rowCount) return res.status(400).json({ message: "This reset code has already been used or expired." });
        await db.query("UPDATE account SET password_hash = $1 WHERE account_id = $2", [await bcrypt.hash(req.body.newPassword, 12), payload.accountId]);
        await db.query("UPDATE session_log SET revoked_at = NOW(), logout_time = NOW(), expires_at = NOW() WHERE account_id = $1 AND revoked_at IS NULL AND logout_time IS NULL", [payload.accountId]);
        await logAudit({ accountId: payload.accountId, action: "PASSWORD_RESET", tableName: "account", recordId: payload.accountId, newValues: { passwordChanged: true, sessionsRevoked: true }, req });
        res.json({ message: "Password updated. You can now log in." });
    } catch (error) { next(error); }
});

router.post("/logout", requireAuth, async (req, res, next) => {
    try {
        await db.query("UPDATE session_log SET revoked_at = NOW(), logout_time = NOW(), expires_at = NOW() WHERE session_id = $1 AND account_id = $2", [req.user.sessionId, req.user.accountId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "LOGOUT", tableName: "session_log", recordId: req.user.sessionId, req });
        res.json({ message: "Signed out successfully." });
    } catch (error) { next(error); }
});

router.get("/me", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT ${accountFields} FROM account WHERE account_id = $1 AND deleted_at IS NULL`, [req.user.accountId]);
        if (!rows[0]) return res.status(404).json({ message: "Account not found." });
        res.json({ user: publicAccount(rows[0]), session: { sessionId: req.session.session_id, expiresAt: req.session.expiresAt } });
    } catch (error) { next(error); }
});

router.get("/sessions", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `SELECT session_id, login_time, last_activity, expires_at, ip_address, user_agent,
                    (session_id = $1) AS current
             FROM session_log WHERE account_id = $2 AND revoked_at IS NULL AND logout_time IS NULL AND expires_at > NOW()
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
        const result = await db.query(
            "UPDATE session_log SET revoked_at = NOW(), logout_time = NOW(), expires_at = NOW() WHERE session_id = $1 AND account_id = $2 AND revoked_at IS NULL AND logout_time IS NULL",
            [sessionId, req.user.accountId]
        );
        if (!result.rowCount) return res.status(404).json({ message: "Active session not found." });
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "SESSION_REVOKED", tableName: "session_log", recordId: sessionId, req });
        res.status(204).end();
    } catch (error) { next(error); }
});

router.post("/logout-all", requireAuth, async (req, res, next) => {
    try {
        await db.query("UPDATE session_log SET revoked_at = NOW(), logout_time = NOW(), expires_at = NOW() WHERE account_id = $1 AND revoked_at IS NULL AND logout_time IS NULL", [req.user.accountId]);
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
        const { rows: before } = await db.query(`SELECT ${accountFields} FROM account WHERE account_id = $1`, [req.user.accountId]);
        // Build $1, $2, … for SET columns; last placeholder is for the WHERE account_id.
        const setClauses = supplied.map(([, column], i) => `${column} = $${i + 1}`).join(", ");
        const values = [...supplied.map(([key]) => req.body[key]), req.user.accountId];
        await db.query(`UPDATE account SET ${setClauses} WHERE account_id = $${supplied.length + 1}`, values);
        const { rows } = await db.query(`SELECT ${accountFields} FROM account WHERE account_id = $1`, [req.user.accountId]);
        await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "UPDATE_PROFILE", tableName: "account", recordId: req.user.accountId, oldValues: before[0], newValues: rows[0], req });
        res.json({ user: publicAccount(rows[0]), session: { sessionId: req.session.session_id, expiresAt: req.session.expiresAt } });
    } catch (error) { next(error); }
});

// ── Google Sign-In ──────────────────────────────────────────────────────────
router.post("/google", [body("credential").isString().notEmpty()], validate, async (req, res, next) => {
    try {
        // 1. Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: req.body.credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const googleId = payload.sub; // unique Google account ID
        const googleEmail = payload.email?.toLowerCase();
        if (!googleEmail || !payload.email_verified) {
            return res.status(400).json({ message: "Google account email is not verified." });
        }

        const firstName = sanitizeText(payload.given_name || payload.name?.split(" ")[0] || "User");
        const lastName = sanitizeText(payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "");

        let account;

        // 2. Look up by google_id first (fastest match for returning Google users)
        const { rows: byGoogleId } = await db.query(
            `SELECT ${accountFields} FROM account WHERE google_id = $1 AND deleted_at IS NULL`,
            [googleId]
        );

        if (byGoogleId.length > 0) {
            account = byGoogleId[0];
        } else {
            // 3. Fall back to email match (links existing manual account to Google)
            const { rows: byEmail } = await db.query(
                `SELECT ${accountFields} FROM account WHERE email = $1 AND deleted_at IS NULL`,
                [googleEmail]
            );

            if (byEmail.length > 0) {
                account = byEmail[0];
                // Link the Google ID to this existing account
                await db.query("UPDATE account SET google_id = $1 WHERE account_id = $2", [googleId, account.account_id]);
            }
        }

        if (account) {
            if (!isActiveAccount(account)) {
                return res.status(401).json({ message: "Your account has been deactivated. Please contact support." });
            }
        } else {
            // 4. Create a new account with Google identity (no password needed)
            const { rows: inserted } = await db.query(
                "INSERT INTO account (first_name, last_name, email, google_id, role) VALUES ($1, $2, $3, $4, 'Customer') RETURNING account_id",
                [firstName, lastName || "", googleEmail, googleId]
            );
            const { rows } = await db.query(`SELECT ${accountFields} FROM account WHERE account_id = $1`, [inserted[0].account_id]);
            account = rows[0];
            await logAudit({ accountId: account.account_id, action: "REGISTER_GOOGLE", tableName: "account", recordId: account.account_id, newValues: { email: googleEmail, googleId, provider: "google" }, req });
        }

        // Create session (same as normal login)
        const signedToken = tokenFor(account, 0);
        const session = await createSession(account, signedToken, req);
        const refreshedToken = tokenFor(account, session.sessionId);
        await db.query("UPDATE session_log SET session_token_hash = $1 WHERE session_id = $2", [hashToken(refreshedToken), session.sessionId]);
        await logAudit({ accountId: account.account_id, sessionId: session.sessionId, action: "LOGIN_GOOGLE", tableName: "account", recordId: account.account_id, req });

        res.json({ token: refreshedToken, user: publicAccount(account), sessionId: session.sessionId, expiresAt: new Date(session.expiresAt).toISOString() });
    } catch (error) {
        if (error.message?.includes("Token used too late") || error.message?.includes("Invalid token")) {
            return res.status(401).json({ message: "Google sign-in failed. Please try again." });
        }
        next(error);
    }
});

module.exports = router;
