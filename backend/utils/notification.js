const db = require("../config/db");

const createInAppNotification = async ({ accountId, bookingId = null, title, message, type = "General" }) => {
    if (!accountId || !title || !message) return;

    await db.query(
        "INSERT INTO notification (account_id, booking_id, title, message, notification_type) VALUES ($1, $2, $3, $4, $5)",
        [accountId, bookingId, title, message, type]
    );
};

module.exports = { createInAppNotification };
