const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const routes = require("./src/routes");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");
const env = require("./src/config/env");

const app = express();

// CORS
app.use(
  cors({
    origin: env.clientUrl || "*",
    credentials: true
  })
);

// Security & middlewares
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes (mounted at /api/v1 in IMS)
app.use("/api/v1", routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;