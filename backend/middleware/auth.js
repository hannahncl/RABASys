const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const getSecret = () => process.env.JWT_SECRET || "change-this-development-secret";
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const parseTtlMilliseconds = () => {
    const value = process.env.JWT_EXPIRES_IN || "24h";
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

async function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Authentication token is required." });

    try {
        const payload = jwt.verify(token, getSecret());
        if (!payload?.accountId || !payload?.sessionId) {
            return res.status(401).json({ message: "Authentication token is invalid or expired." });
        }

        const [rows] = await db.execute(
            `SELECT session_id, account_id, expires_at, revoked_at, logout_time, last_activity
             FROM session_log
             WHERE session_id = ? AND account_id = ? AND revoked_at IS NULL AND logout_time IS NULL`,
            [payload.sessionId, payload.accountId]
        );

        if (!rows[0]) {
            return res.status(401).json({ message: "Your session has expired or been revoked. Please log in again." });
        }

        const expiresAt = new Date(Date.now() + parseTtlMilliseconds());
        await db.execute(
            "UPDATE session_log SET last_activity = NOW(), expires_at = ? WHERE session_id = ?",
            [toDbDateTime(expiresAt), rows[0].session_id]
        );

        req.user = payload;
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
