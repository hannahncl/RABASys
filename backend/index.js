const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Vercel uses this exported Express app as a serverless function.
// Local development continues to use server.js.
module.exports = require("./app");
