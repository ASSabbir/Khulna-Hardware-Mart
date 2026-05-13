const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { auth } = require("../middleware/auth");

// Generate JWT token
const generateToken = (adminId) => {
  return jwt.sign(
    { adminId },
    process.env.JWT_SECRET || "khulna_hardware_mart_secret_key_2024",
    { expiresIn: "7d" }
  );
};

// Check if admin exists (public route)
router.get("/check", async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    res.json({ needsSetup: adminCount === 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate token
    const token = generateToken(admin._id);

    // Return admin info (without password) and token
    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Get current admin (protected route)
router.get("/me", auth, async (req, res) => {
  res.json({ admin: req.admin });
});

// Update admin profile (protected)
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, username, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (username) updates.username = username;
    if (email) updates.email = email.toLowerCase();

    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      updates,
      { new: true }
    ).select("-password");

    res.json({ admin });
  } catch (error) {
    res.status(500).json({ message: "Server error updating profile." });
  }
});

// Change password (protected)
router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }

    const admin = await Admin.findById(req.admin._id);

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error changing password." });
  }
});

// Create initial admin (only if no admins exist)
router.post("/init", async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(400).json({ message: "Admin already exists. Setup not allowed." });
    }

    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
    });

    const token = generateToken(admin._id);

    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username or email already exists." });
    }
    res.status(500).json({ message: "Server error during setup." });
  }
});

module.exports = router;