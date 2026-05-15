const mongoose = require("mongoose");
const env = require("./env");  // Import env config

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri);
    
    console.log(`✅ IMS MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ IMS Database connection error:`, error.message);
    process.exit(1);
  }
};

module.exports = connectDb;