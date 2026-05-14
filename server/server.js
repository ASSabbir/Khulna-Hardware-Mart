const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());

// JSON parser with increased limit for large requests
app.use(express.json({ limit: "10mb" }));

// Connect to MongoDB before each request
app.use(async (req, res, next) => {
  if (process.env.MONGO_URI) {
    const { ensureConnection } = require("./config/db");
    await ensureConnection();
  }
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/product"));
app.use("/api/suppliers", require("./routes/supplier"));
app.use("/api/partners", require("./routes/partner"));
app.use("/api/customers", require("./routes/customer"));
app.use("/api/invoices", require("./routes/invoice"));

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const { connectDB } = require("./config/db");
  connectDB();

  const PORT =5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel serverless
module.exports = app;