import express from "express";
import Prisma from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import authMiddleware from "../middleware/authMiddleware.js";

import dotenv from "dotenv";
dotenv.config();

const authRouter = express.Router();
// ==========================
// 1. SIGNUP ROUTE
// ==========================
authRouter.post("/signup", async (req, res) => {
  try {
    const { hostelName, email, password } = req.body;

    // 1. Check if hostel already exists
    const existingHostel = await Prisma.hostel.findUnique({
      where: { email },
    });

    if (existingHostel) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 2. Hash the password using your utility
    const hashedPassword = await hashPassword(password);

    // 3. Create the new hostel record
    const newHostel = await Prisma.hostel.create({
      data: {
        hostelName,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: "Hostel registered successfully",
      hostel: {
        id: newHostel.id,
        hostelName: newHostel.hostelName,
        email: newHostel.email,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 2. LOGIN ROUTE
// ==========================

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password, secret } = req.body;

    // --- SPECIAL ADMIN BACKDOOR ---
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      if (secret === process.env.ADMIN_SECRET) {
        // Simple secret key
        const token = generateToken({ id: 0, email: "admin@tuition.com" });
        return res
          .status(200)
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
          })
          .json({
            message: "Super Admin login successful",
            token,
            hostel: {
              id: 0,
              hostelName: "Main Hostel",
              email: "admin@tuition.com",
            },
          });
      } else {
        return res.status(401).json({ message: "Invalid Secret Key" });
      }
    }
    // 1. Find the hostel by email
    const hostel = await Prisma.hostel.findUnique({
      where: { email },
    });

    if (!hostel) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Verify password using your utility
    const isPasswordValid = await comparePassword(password, hostel.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Generate Token using your utility
    // Assuming generateToken accepts (payload, expiresIn) or just (payload)
    const token = generateToken({ id: hostel.id, email: hostel.email });

    res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .json({
        message: "Login successful",
        token,
        hostel: {
          id: hostel.id,
          hostelName: hostel.hostelName,
          email: hostel.email,
        },
      });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 3. SUPER ADMIN RESET PASSWORD
// ==========================
authRouter.put("/admin-reset-password", authMiddleware, async (req, res) => {
  try {
    // 1. Security Check: Only Super Admin can use this
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({
        message: "Unauthorized: Only Super Admin can reset passwords directly",
      });
    }

    const { hostelId, newPassword } = req.body;

    if (!hostelId || !newPassword) {
      return res.status(400).json({
        message: "Please provide the Hostel ID and the New Password",
      });
    }

    const idToUpdate = parseInt(hostelId);

    // 2. Check if the hostel admin exists
    const existingHostel = await Prisma.hostel.findUnique({
      where: { id: idToUpdate },
    });

    if (!existingHostel) {
      return res.status(404).json({ message: "Hostel admin not found" });
    }

    // 3. Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // 4. Update the database
    await Prisma.hostel.update({
      where: { id: idToUpdate },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      message: `Password for '${existingHostel.hostelName}' has been reset successfully.`,
    });
  } catch (error) {
    console.error("Admin Reset Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default authRouter;
