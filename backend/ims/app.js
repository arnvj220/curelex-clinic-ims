import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import routes from './src/routes/index.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import env from './src/config/env.js';

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

export default app;