const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env")
});

const { Pool, types } = require("pg");

// PostgreSQL DATE columns are calendar dates, not instants. Returning them as
// strings prevents node-postgres from converting midnight to a local Date and
// serializing it as the previous UTC day in API responses.
types.setTypeParser(1082, (value) => value);

// Apply the timezone before the pool hands a new connection to application queries.
// Supabase's pooler can ignore startup options, and these columns are timestamp without time zone.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    onConnect: async (client) => {
        await client.query("SET TIME ZONE 'Asia/Manila'");
    }
});

module.exports = pool;
