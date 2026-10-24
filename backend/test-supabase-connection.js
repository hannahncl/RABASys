/**
 * test-supabase-connection.js
 *
 * Standalone Supabase/PostgreSQL connection test.
 * Reuses the existing pool from config/db.js (which loads backend/.env).
 *
 * Run from the backend/ directory:
 *   node test-supabase-connection.js
 *
 * Read-only. Does NOT start the Express server, run migrations,
 * or modify any data. Safe to run against a production database.
 */

// db.js already calls dotenv.config({ path: <backend>/.env }) at require-time,
// so no additional dotenv setup is needed here.
const pool = require("./config/db");

async function testSupabaseConnection() {
    let client;

    try {
        // Borrow a single client from the pool for the test query.
        client = await pool.connect();

        const result = await client.query(
            "SELECT NOW() AS current_time, current_database() AS database_name"
        );

        const { current_time, database_name } = result.rows[0];

        console.log("✅ Supabase connection successful!");
        console.log(`   Database : ${database_name}`);
        console.log(`   Server time : ${current_time}`);

    } catch (error) {
        // Log a safe message — never print the connection string or credentials.
        console.error("❌ Supabase connection failed.");
        console.error(`   Error : ${error.message}`);
        console.error(
            "   Hint  : Check that DATABASE_URL is set correctly in backend/.env"
        );
        process.exitCode = 1;

    } finally {
        // Release the borrowed client back to the pool before ending it.
        if (client) client.release();

        // pool.end() drains and closes all connections in the pg Pool.
        await pool.end();
    }
}

testSupabaseConnection();
