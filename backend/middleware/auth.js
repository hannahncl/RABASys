const jwt = require("jsonwebtoken");

const getSecret = () => process.env.JWT_SECRET || "change-this-development-secret";

function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Authentication token is required." });

    try {
        req.user = jwt.verify(token, getSecret());
        next();
    } catch {
        res.status(401).json({ message: "Authentication token is invalid or expired." });
    }
}

function allowRoles(...roles) {
    return (req, res, next) => {
        const currentRole = String(req.user?.role || '').trim().toLowerCase();
        const allowedRoles = roles.map((role) => String(role).trim().toLowerCase());

        if (!allowedRoles.includes(currentRole)) {
            return res.status(403).json({ message: "You do not have permission for this action." });
        }
        next();
    };
}

module.exports = { requireAuth, allowRoles, getSecret };
