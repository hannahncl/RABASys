require("dotenv").config();

const app = require("./app");
const db = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Test database connection
        await db.query("SELECT 1");

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