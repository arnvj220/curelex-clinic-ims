import dotenv from 'dotenv';

dotenv.config();
console.log(process.env.SUPER_ADMIN_EMAIL);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  
  clinicMongoUri: process.env.CLINIC_MONGO_URI || "mongodb://127.0.0.1:27017/clinic_db",
  
  jwtSecret: process.env.JWT_SECRET || "replace-with-strong-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || "admin@clinic.local",
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || "admin123",
  
  clientUrl: process.env.CLIENT_URL || "*"
};

export default env;
