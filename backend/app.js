const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default Route
app.get("/", (req, res) => {
    res.send("RABAS Travel and Tours Backend API is running...");
});

module.exports = app;