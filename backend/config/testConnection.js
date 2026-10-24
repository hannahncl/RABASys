const db = require("./db");

async function testConnection() {
    try {
        const { rows } = await db.query('SELECT NOW() AS "currentTime"');

        console.log("✅ Supabase PostgreSQL Connected!");
        console.log("Database time:", rows[0].currentTime);
    } catch (error) {
        console.error("❌ Database Connection Failed");
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

testConnection();
