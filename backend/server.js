const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Import systems
const imsApp = require("./ims/app");
const clinicModule = require("./clinic/app");

const mainApp = express();
const server = http.createServer(mainApp);

// ========== SOCKET.IO SETUP (for Clinic queue system) ==========
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Make io available to clinic routes
mainApp.set('io', io);

// Socket connection handling (original clinic functionality)
io.on('connection', (socket) => {
  console.log('🔌 Clinic client connected:', socket.id);
  
  socket.on('join_queue', ({ clinicId, doctorId, date }) => {
    const room = `queue_${clinicId}_${doctorId}_${date}`;
    socket.join(room);
    console.log(`📡 Socket ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ========== MIDDLEWARE ==========
mainApp.use(cors({ origin: "*", credentials: true }));
mainApp.use(express.json());

// ========== MOUNT IMS SYSTEM ==========
// IMS expects routes at /api/v1/*
mainApp.use("/api/ims", imsApp);
// IMS endpoints become: /api/ims/api/v1/*

// ========== MOUNT CLINIC SYSTEM ==========
// Initialize clinic database first
const initClinic = async () => {
  const { app: clinicApp, initClinicDB } = clinicModule;
  await initClinicDB();
  
  // Mount clinic routes at /api/clinic
  mainApp.use("/api/clinic", clinicApp);
  // Clinic endpoints become: /api/clinic/auth, /api/clinic/patients, etc.
  
  console.log('✅ Clinic system mounted at /api/clinic');
};

// ========== HEALTH CHECKS ==========
mainApp.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    systems: {
      ims: "/api/ims/api/v1",
      clinic: "/api/clinic"
    },
    websockets: true
  });
});

mainApp.get("/api/ims/health", (req, res) => {
  res.json({ status: "IMS OK" });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize IMS database
    const connectIMS = require("./ims/src/config/db");
    await connectIMS();
    console.log('✅ IMS Database connected');
    
    // Initialize Clinic system
    await initClinic();
    
    // Start listening
    server.listen(PORT, () => {
      console.log(`\n🚀 MERGED SERVER running on port ${PORT}`);
      console.log(`📦 IMS API: http://localhost:${PORT}/api/ims/api/v1`);
      console.log(`🏥 Clinic API: http://localhost:${PORT}/api/clinic`);
      console.log(`🔌 WebSockets: ENABLED (Clinic queue system)`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();