const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  // ✅ IMPORTANT (Render fix)
  port: process.env.PORT || 5000,

  // ✅ MongoDB (Atlas use karega production me)
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ims_db",

  jwtSecret: process.env.JWT_SECRET || "replace-with-strong-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",

  defaultGstRate: Number(process.env.DEFAULT_GST_RATE || 18),
  invoicePrefix: process.env.INVOICE_PREFIX || "INV",
  invoiceDigits: Number(process.env.INVOICE_DIGITS || 4),

  // ✅ allow all in production (fix CORS issue)
  clientUrl: process.env.CLIENT_URL || "*"
};

module.exports = env;