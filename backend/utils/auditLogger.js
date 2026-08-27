const db = require("../config/db");

const sensitiveKey = /password|token|otp|secret/i;
const sanitizeValues = (value) => {
    if (Array.isArray(value)) return value.map(sanitizeValues);
    if (!value || typeof value !== "object" || value instanceof Date) return value;

    return Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => !sensitiveKey.test(key))
            .map(([key, item]) => [key, sanitizeValues(item)])
    );
};

// JSON is serialized explicitly so mysql2 sends valid JSON values consistently.
// Callers intentionally receive errors: silently losing accountability records is unsafe.
async function logAudit({ accountId = null, sessionId = null, action, tableName, recordId = null, oldValues = null, newValues = null, req = null }) {
    const forwardedFor = req?.headers?.["x-forwarded-for"];
    const ipAddress = typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0].trim()
        : (req?.ip || req?.socket?.remoteAddress || null);
    const userAgent = req?.get?.("user-agent") || req?.headers?.["user-agent"] || null;

    await db.execute(
        `INSERT INTO audit_log (account_id, session_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            accountId,
            sessionId,
            action,
            tableName,
            recordId == null ? null : String(recordId),
            oldValues == null ? null : JSON.stringify(sanitizeValues(oldValues)),
            newValues == null ? null : JSON.stringify(sanitizeValues(newValues)),
            ipAddress ? String(ipAddress).slice(0, 45) : null,
            userAgent ? String(userAgent).slice(0, 512) : null,
        ]
    );
}

module.exports = { logAudit };
