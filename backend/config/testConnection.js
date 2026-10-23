<<<<<<< HEAD
=======

require("dotenv").config();

>>>>>>> b479bc2659a36606ed7a0f47ff189cad3d0c2920
const db = require("./db");

async function testConnection() {
    try {
<<<<<<< HEAD
        const { rows } = await db.query('SELECT NOW() AS "currentTime"');
=======
        const result = await db.query("SELECT NOW() AS current_time");
>>>>>>> b479bc2659a36606ed7a0f47ff189cad3d0c2920

        console.log("✅ Supabase PostgreSQL Connected!");
        console.log("Database time:", result.rows[0].current_time);
    } catch (error) {
        console.error("❌ Database Connection Failed");
        console.error(error.message);
<<<<<<< HEAD
        process.exitCode = 1;
=======
>>>>>>> b479bc2659a36606ed7a0f47ff189cad3d0c2920
    } finally {
        await db.end();
    }
}

testConnection();
