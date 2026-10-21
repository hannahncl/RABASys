const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = require("./app");
const db = require("./config/db");
const { ensureSchema } = require("./config/ensureSchema");
const { sendTripReminders } = require("./services/tripReminderService");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await db.query("SELECT 1");
        // Keep the booking table compatible with custom-trip requests.
        // This is safe to run repeatedly and supports existing Supabase databases.
        await db.query("ALTER TABLE booking ADD COLUMN IF NOT EXISTS customized_details JSONB NULL");
        await db.query("ALTER TABLE account ADD COLUMN IF NOT EXISTS profile_picture TEXT NULL");
        if (process.env.RUN_SCHEMA === "true") {
            await ensureSchema();
        }
        if (process.env.RUN_TRIP_REMINDERS !== "false") {
            // Check on startup and hourly; the reminder log prevents duplicate emails.
            sendTripReminders().catch((error) => console.error("[reminders] Initial check failed:", error.message));
            setInterval(() => {
                sendTripReminders().catch((error) => console.error("[reminders] Scheduled check failed:", error.message));
            }, 60 * 60 * 1000);
        }

        console.log("✅ Connected to MySQL Database");

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to MySQL");
        console.error(error.message);
    }
}

startServer();
