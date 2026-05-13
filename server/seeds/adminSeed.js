/**
 * Run this script to create the initial admin user
 * Usage: node seeds/adminSeed.js
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Admin = require("../models/Admin");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/khm";

const adminData = {
  username: "admin",
  email: "admin@khulnahardwaremart.com",
  password: "admin123", // Change this password in production!
  name: "Administrator"
};

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("Admin already exists!");
      console.log("Email:", existingAdmin.email);
      console.log("Name:", existingAdmin.name);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create admin
    const admin = await Admin.create({
      ...adminData,
      password: hashedPassword
    });

    console.log("Admin created successfully!");
    console.log("Email:", admin.email);
    console.log("Name:", admin.name);
    console.log("Username:", admin.username);
    console.log("\nDefault password: admin123");
    console.log("⚠️  Change this password immediately after first login!");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

createAdmin();