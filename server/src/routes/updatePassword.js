import express from "express";
import Prisma from "../lib/prisma.js";
import { hashPassword } from "../utils/hash.js";
import authMiddleware from "../middleware/authMiddleware.js";

import dotenv from "dotenv";
dotenv.config();

const updatePasswordRouter = express.Router();

// ==========================
// 1. SUPER ADMIN RESET PASSWORD
// ==========================
updatePasswordRouter.put(
  "/admin-reset-password",
  authMiddleware,
  async (req, res) => {
    try {
      // 1. Security Check: Only Super Admin can use this
      if (!req.user.isSuperAdmin) {
        return res.status(403).json({
          message:
            "Unauthorized: Only Super Admin can reset passwords directly",
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
  },
);

export default updatePasswordRouter;
