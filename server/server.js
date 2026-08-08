const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);


// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(compression()); // Phase 10 B3 — gzip API responses

// Phase 10 B4 — basic rate limiting to prevent abuse/accidental heavy load
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // 300 requests/min per IP, generous for normal admin usage
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down." },
});
app.use("/api/", apiLimiter);

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
const returnRoutes = require("./routes/return");
const purchaseHistoryRoutes = require("./routes/purchaseHistory");
const ledgerRoutes = require("./routes/ledger");

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/product"));
app.use("/api/suppliers", require("./routes/supplier"));
app.use("/api/partners", require("./routes/partner"));
app.use("/api/customers", require("./routes/customer"));
app.use("/api/invoices", require("./routes/invoice"));
app.use("/api/returns", returnRoutes);
app.use("/api/purchase-history", purchaseHistoryRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/options", require("./routes/dynamicOption"));
app.use("/api/supplier-payments", require("./routes/supplierPayment"));
app.use("/api/custom-product-sources", require("./routes/customProductSource"));
app.use("/api/supplier-purchase-orders", require("./routes/supplierPurchaseOrder"));

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