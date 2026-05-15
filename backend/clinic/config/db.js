const mongoose = require('mongoose');

const connectClinicDB = async () => {
  try {
    const conn = await mongoose.createConnection(process.env.CLINIC_MONGO_URI || 'mongodb://127.0.0.1:27017/clinic_db');
    console.log(`Clinic DB connected`);
    return conn;
  } catch (error) {
    console.error('Clinic DB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectClinicDB;