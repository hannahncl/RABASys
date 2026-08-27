const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const rentalBookingRoutes = require("./routes/rentalBookingRoutes");
const tourGuideRoutes = require("./routes/tourGuideRoutes");

const app = express();

// Middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Vite can choose a different local port when its default is busy.
        const isLocalVite = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
        if (!origin || isLocalVite || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS."));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Default Route
app.get("/", (req, res) => {
    res.json({ name: "RABAS Travel and Tours API", status: "running" });
});

const notificationRoutes = require("./routes/notificationRoutes");

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/rental-bookings", rentalBookingRoutes);
app.use("/api/tour-guides", tourGuideRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", resourceRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((error, req, res, next) => {
    console.error(error);
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ message: "Invalid JSON body." });
    }
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "A record with that unique value already exists." });
    if (error.code === "ER_NO_REFERENCED_ROW_2") return res.status(422).json({ message: "A referenced record does not exist." });
    res.status(500).json({ message: "An unexpected server error occurred." });
});

module.exports = app;
