const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

let developmentSecret;
const getSecret = () => {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be configured in production.");
    // A per-process development secret avoids shipping a known signing key.
    developmentSecret ||= crypto.randomBytes(48).toString("hex");
    return developmentSecret;
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

async function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Authentication token is required." });

    try {
        const payload = jwt.verify(token, getSecret());
        if (!payload?.accountId || !payload?.sessionId) {
            return res.status(401).json({ message: "Authentication token is invalid or expired." });
        }

        const [rows] = await db.execute(
            `SELECT s.session_id, s.account_id, s.expires_at, s.revoked_at, s.logout_time, s.last_activity,
                    a.role, a.account_status
             FROM session_log s JOIN account a ON a.account_id = s.account_id
             WHERE s.session_id = ? AND s.account_id = ? AND s.session_token_hash = ?
               AND s.revoked_at IS NULL AND s.logout_time IS NULL AND s.expires_at > NOW()
               AND a.deleted_at IS NULL AND a.account_status = 'Active'`,
            [payload.sessionId, payload.accountId, hashToken(token)]
        );

        if (!rows[0]) {
            return res.status(401).json({ message: "Your session has expired or been revoked. Please log in again." });
        }

        await db.execute(
            "UPDATE session_log SET last_activity = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE session_id = ?",
            [sessionTtlSeconds(), rows[0].session_id]
        );

        const expiresAt = new Date(Date.now() + parseTtlMilliseconds());

        // Use the current database role, not a potentially stale claim in the token.
        req.user = { ...payload, role: rows[0].role };
        req.session = {
            ...rows[0],
            expiresAt: expiresAt.toISOString(),
        };
        next();
    } catch {
        res.status(401).json({ message: "Authentication token is invalid or expired." });
    }
}

function allowRoles(...roles) {
    return (req, res, next) => {
        const currentRole = String(req.user?.role || "").trim().toLowerCase();
        const allowedRoles = roles.map((role) => String(role).trim().toLowerCase());

        if (!allowedRoles.includes(currentRole)) {
            return res.status(403).json({ message: "You do not have permission for this action." });
        }
        next();
    };
}

module.exports = { requireAuth, allowRoles, getSecret };
