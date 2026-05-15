// const express = require("express");
// const { dashboardSummary, stockReport, movementReport, exportSalesCsv } = require("../controllers/reportController");
// const { protect } = require("../middleware/authMiddleware");

// const router = express.Router();

// router.use(protect);
// router.get("/dashboard", dashboardSummary);
// router.get("/stock", stockReport);
// router.get("/movement", movementReport);
// router.get("/sales/export.csv", exportSalesCsv);

// module.exports = router;


const express = require("express");
const jwt = require("jsonwebtoken");
const {
  dashboardSummary,
  stockReport,
  movementReport,
  exportSalesCsv,
  downloadReportPdf
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const env = require("../config/env");

const router = express.Router();

// All routes except PDF download require normal Bearer token auth
router.use("/dashboard",        protect, dashboardSummary);
router.use("/stock",            protect, stockReport);
router.use("/movement",         protect, movementReport);
router.use("/sales/export.csv", protect, exportSalesCsv);

// PDF download: supports both Bearer token (middleware) AND ?token= query param
// so browser <a href> direct downloads work without fetch
router.get("/download-pdf", (req, res, next) => {
  // If Authorization header present, use normal protect middleware
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  // Otherwise verify ?token= query param manually
  if (req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token, env.jwtSecret);
      req.user = { _id: decoded.id };
      return next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
}, downloadReportPdf);

module.exports = router;