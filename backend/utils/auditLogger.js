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

// Audit failures must never change the result of the business operation.
// JSON is serialized explicitly so mysql2 sends valid JSON values consistently.
async function logAudit({ accountId, action, tableName, recordId, oldValues = null, newValues = null }) {
    try {
        await db.execute(
            `INSERT INTO audit_log (account_id, action, table_name, record_id, old_values, new_values)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                accountId,
                action,
                tableName,
                recordId,
                oldValues == null ? null : JSON.stringify(sanitizeValues(oldValues)),
                newValues == null ? null : JSON.stringify(sanitizeValues(newValues)),
            ]
        );
    } catch (error) {
        console.error("[audit] Failed to write audit log:", error);
    }
}

module.exports = { logAudit };
