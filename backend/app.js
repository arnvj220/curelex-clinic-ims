const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Import the two systems
const imsApp = require("./ims/app");
const clinicApp = require("./clinic/app"); // We'll create this

const mainApp = express();

// Basic middleware for main app
mainApp.use(cors({ origin: "*", credentials: true }));
mainApp.use(express.json());

// ========== MOUNT IMS SYSTEM ==========
// IMS routes are already prefixed with /api/v1 internally
mainApp.use("/ims", imsApp); 
// This makes IMS accessible at /ims/api/v1/*

// ========== MOUNT CLINIC SYSTEM ==========
// Clinic will be mounted at /clinic
// We'll create clinic app that exports without listening

// Health check for merged system
mainApp.get("/health", (req, res) => {
  res.json({
    status: "OK",
    systems: ["ims", "clinic"],
    endpoints: {
      ims: "/ims/api/v1",
      clinic: "/clinic/api"
    }
  });
});

module.exports = mainApp;