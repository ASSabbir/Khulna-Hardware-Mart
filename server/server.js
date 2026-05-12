const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/products", require("./routes/product"));
app.use("/api/suppliers", require("./routes/supplier"));
app.use("/api/partners", require("./routes/partner"));
app.use("/api/customers", require("./routes/customer"));
app.use("/api/invoices", require("./routes/invoice"));

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));