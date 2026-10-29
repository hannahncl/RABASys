const path = require("path");
const os = require("os");

// Vercel only provides writable temporary storage under /tmp. Local uploads
// continue to use the repository's uploads directory.
const uploadRoot = process.env.VERCEL
    ? path.join(os.tmpdir(), "rabasys-uploads")
    : path.join(__dirname, "..", "uploads");

module.exports = uploadRoot;
