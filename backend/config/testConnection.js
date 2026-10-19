
require("dotenv").config();

const db = require("./db");

async function testConnection() {
    try {
        const result = await db.query("SELECT NOW() AS current_time");

        console.log("✅ Supabase PostgreSQL Connected!");
        console.log("Database time:", result.rows[0].current_time);
    } catch (error) {
        console.error("❌ Database Connection Failed");
        console.error(error.message);
    } finally {
        await db.end();
    }
}

testConnection();
