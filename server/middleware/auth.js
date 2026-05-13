const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "khulna_hardware_mart_secret_key_2024");

    const admin = await Admin.findById(decoded.adminId).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Invalid token. Admin not found." });
    }

    req.admin = admin;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    }
    res.status(500).json({ message: "Server error during authentication." });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.admin = null;
      return next();
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "khulna_hardware_mart_secret_key_2024");

    const admin = await Admin.findById(decoded.adminId).select("-password");
    req.admin = admin;
    next();
  } catch (error) {
    req.admin = null;
    next();
  }
};

module.exports = { auth, optionalAuth };