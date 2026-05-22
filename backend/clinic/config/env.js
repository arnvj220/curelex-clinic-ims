import dotenv from 'dotenv';
dotenv.config();

const env = {
  nodeEnv:            process.env.NODE_ENV            || "development",
  port:               process.env.PORT                || 5000,
  mongoUri:           process.env.MONGO_URI           || "mongodb://127.0.0.1:27017/curelex_dbms",
  jwtSecret:          process.env.JWT_SECRET          || "replace-with-strong-secret",
  jwtExpiresIn:       process.env.JWT_EXPIRES_IN      || "30d",   // ✅ FIXED: was "7d", now "30d"
  ssoSecret:          process.env.SSO_SECRET          || "replace-with-sso-secret",
  superAdminEmail:    process.env.SUPER_ADMIN_EMAIL   || "admin@clinic.local",
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || "admin123",
  clientUrl:          process.env.CLIENT_URL          || "*",
};

export default env;