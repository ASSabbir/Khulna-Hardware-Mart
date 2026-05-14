const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  // If already connected, don't reconnect
  if (isConnected) {
    return;
  }

  // If there's an existing connection that's ready, use it
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  try {
    const str ='mongodb+srv://atiksabbir1125_db_user:e5G1iQQTNN9QMLQt@cluster0.u5ofti2.mongodb.net/?appName=Cluster0'
    const conn = await mongoose.connect(str, {
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
    });
    isConnected = true;
    console.log("MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    // Don't throw in serverless - let the request handle the error
    isConnected = false;
  }
};

// Export a function that ensures connection before each operation
const ensureConnection = async () => {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    await connectDB();
  }
};

module.exports = { connectDB, ensureConnection };
module.exports.default = connectDB;