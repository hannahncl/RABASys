require("dotenv").config();

const app = require("./app");
const db = require("./config/db");
const { ensureSchema } = require("./config/ensureSchema");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await db.query("SELECT 1");
        await ensureSchema();

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
