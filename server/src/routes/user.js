import express from "express";
import Prisma from "../lib/prisma.js";
import { hashPassword } from "../utils/hash.js";

import dotenv from "dotenv";
dotenv.config();

const userRouter = express.Router();

// ==========================
// UPDATE PROFILE ROUTE
// ==========================
userRouter.put("/update-profile", async (req, res) => {
  try {
    // Assume verifyToken middleware adds the logged-in user's info to req.user
    // const userId = req.user.id;
    const userId = 1;
    const { hostelName, email, password } = req.body;

    // 1. Prepare the data object for update
    const updateData = {};

    if (hostelName) updateData.hostelName = hostelName;

    // 2. Handle Email Update (Check for conflicts)
    if (email) {
      // Check if the new email is already taken by a DIFFERENT user
      const existingUser = await Prisma.hostel.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return res
          .status(400)
          .json({ message: "Email already in use by another account" });
      }
      updateData.email = email;
    }

    // 3. Handle Password Update (Hash it)
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // 4. Update the record in the database
    const updatedHostel = await Prisma.hostel.update({
      where: { id: userId },
      data: updateData,
    });

    // 5. Response (Exclude password)
    res.status(200).json({
      message: "Profile updated successfully",
      hostel: {
        id: updatedHostel.id,
        hostelName: updatedHostel.hostelName,
        email: updatedHostel.email,
        updatedAt: new Date(), // specific timestamp
      },
    });
  } catch (error) {
    console.error("Update Error:", error);

    // Handle case where user ID from token doesn't exist in DB
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.put("/update-fee", async (req, res) => {
  try {
    // const userId = req.user.id; // From token
    const userId = 1;
    const { amount } = req.body;

    // 1. Validation
    if (amount === undefined || amount === null) {
      return res.status(400).json({ message: "Fee amount is required" });
    }

    // 2. Update the Hostel record directly
    const updatedHostel = await Prisma.hostel.update({
      where: { id: userId },
      data: {
        fee: parseFloat(amount),
      },
      select: {
        id: true,
        hostelName: true,
        email: true,
        fee: true, // Return the updated fee
      },
    });

    res.status(200).json({
      message: "Fee updated successfully",
      hostel: updatedHostel,
    });
  } catch (error) {
    console.error("Update Fee Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default userRouter;
