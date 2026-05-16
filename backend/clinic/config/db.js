import mongoose from 'mongoose';
import env from './env.js';

const connectClinicDB = async () => {
  try {
    const conn = await mongoose.createConnection(env.clinicMongoUri);
    console.log(`Clinic DB connected`);
    return conn;
  } catch (error) {
    console.error('Clinic DB connection error:', error);
    process.exit(1);
  }
};

export default connectClinicDB;