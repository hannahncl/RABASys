const db = require("./db");

async function testConnection() {
    try {
        const { rows } = await db.query('SELECT NOW() AS "currentTime"');

        console.log("✅ Database Connected!");
        console.log(rows);
    } catch (error) {
        console.error("❌ Database Connection Failed");
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

testConnection();