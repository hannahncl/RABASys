const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env")
});

const { Pool, types } = require("pg");

// PostgreSQL DATE columns are calendar dates, not instants. Returning them as
// strings prevents node-postgres from converting midnight to a local Date and
// serializing it as the previous UTC day in API responses.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Supabase's pooler can ignore startup options and leave sessions in UTC.
// These columns are timestamp without time zone, so set each physical DB
// connection explicitly before it is used for application queries.
pool.on("connect", (client) => {
    client.query("SET TIME ZONE 'Asia/Manila'").catch((error) => {
        console.error("Failed to set database timezone:", error.message);
    });
});

module.exports = pool;
