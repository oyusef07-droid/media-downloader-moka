"use strict";
require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");
const { dispatch } = require("./dispatcher");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max:      parseInt(process.env.RATE_LIMIT_MAX, 10) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please slow down." },
});
app.use("/api/", limiter);

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/api/fetch", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: "Missing required query parameter: url" });
  try {
    const result = await dispatch(decodeURIComponent(url));
    return res.json(result);
  } catch (err) {
    const message = err?.message || "An unexpected error occurred.";
    const status = message.includes("Invalid URL") ? 400
      : message.includes("Unsupported") ? 400
      : message.includes("timed out") ? 504
      : message.includes("private") ? 403 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

app.use((_req, res) => res.status(404).json({ success: false, error: "Route not found." }));
app.use((err, _req, res, _next) => res.status(500).json({ success: false, error: "Internal server error." }));

process.on("uncaughtException",  (err) => console.error("[uncaughtException]",  err.message));
process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err?.message || err));

app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
module.exports = app;
