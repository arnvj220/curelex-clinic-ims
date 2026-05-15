const express = require("express");
const cors = require("cors");
const connectClinicDB = require("./config/db");

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Database connection (will be initialized when mounted)
let clinicDbConnection = null;

const initClinicDB = async () => {
  if (!clinicDbConnection) {
    clinicDbConnection = await connectClinicDB();
  }
  return clinicDbConnection;
};

// Make db available to routes
app.set('clinicDb', clinicDbConnection);

// Routes (without /api prefix - we'll add in main app)
app.use('/auth', require('./routes/auth'));
app.use('/clinics', require('./routes/clinics'));
app.use('/users', require('./routes/users'));
app.use('/patients', require('./routes/patients'));
app.use('/superadmin', require('./routes/superadmin'));
app.use('/queue', require('./routes/queue'));

// Health check for clinic system
app.get('/health', (req, res) => {
  res.json({ status: 'Clinic system OK' });
});

module.exports = { app: app, initClinicDB };