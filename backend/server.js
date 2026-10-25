const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = require("./app");
const db = require("./config/db");
const { ensurePostgresSchema, ensureMapStoryLocationColumns } = require("./config/ensurePostgresSchema");
const { sendTripReminders } = require("./services/tripReminderService");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await db.query("SELECT 1");
        // Keep the Joiner package form usable even when the optional full
        // schema migration flag is disabled. This small migration is
        // idempotent and is required by the public booking/payment flow.
        await db.query(
            "ALTER TABLE tour_package ADD COLUMN IF NOT EXISTS joiner_downpayment_percent NUMERIC(5,2) NOT NULL DEFAULT 30"
        );
        await db.query(
            "ALTER TABLE booking ADD COLUMN IF NOT EXISTS participant_names JSONB"
        );
        await db.query("ALTER TABLE booking ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)");
        await db.query("ALTER TABLE booking ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100)");
        await db.query("ALTER TABLE booking ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2)");
        await db.query("ALTER TABLE booking ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50)");
        if (process.env.RUN_MIGRATIONS === "true") {
            await db.query(
                "ALTER TABLE booking ADD COLUMN IF NOT EXISTS customized_details JSONB"
            );

            await db.query(
                "ALTER TABLE account ADD COLUMN IF NOT EXISTS profile_picture TEXT"
            );
        }
        if (process.env.RUN_SCHEMA === "true") {
            await ensurePostgresSchema();
        }
        await ensureMapStoryLocationColumns();
        if (process.env.RUN_TRIP_REMINDERS !== "false") {
            // Check on startup and hourly; the reminder log prevents duplicate emails.
            sendTripReminders().catch((error) => console.error("[reminders] Initial check failed:", error.message));
            setInterval(() => {
                sendTripReminders().catch((error) => console.error("[reminders] Scheduled check failed:", error.message));
            }, 60 * 60 * 1000);
        }

        console.log("✅ Connected to Supabase PostgreSQL Database");

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to Supabase PostgreSQL");
        console.error(error.message);
    }
}

startServer();
