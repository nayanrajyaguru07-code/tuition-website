import express from "express";
import multer from "multer";
import fs from "fs";
import Prisma from "../lib/prisma.js";
import { uploadImage, deleteImage } from "../utils/uploadImage.js";
import authMiddleware from "../middleware/authMiddleware.js";

const employeeRouter = express.Router();

// Multer Setup for temporary storage
const upload = multer({ dest: "uploads/" });

const uploadFields = upload.fields([
  { name: "passportPhoto", maxCount: 1 },
  { name: "idProof", maxCount: 1 },
]);

// ==========================
// 1. ADD STAFF (POST)
// ==========================
employeeRouter.post(
  "/add-staff",
  authMiddleware,
  uploadFields,
  async (req, res) => {
    try {
      const hostelId = req.user.id;
      // const hostelId = 1;

      const {
        name,
        email,
        phone,
        address,
        gender,
        role,
        salary,
        dateOfJoining,
      } = req.body;

      // 1. Validation
      if (!name || !phone || !role) {
        return res
          .status(400)
          .json({ message: "Name, Phone, and Role are required" });
      }

      // 2. Image Upload (if provided)
      let photoUrl = null;
      if (req.files.passportPhoto) {
        try {
          photoUrl = await uploadImage(req.files.passportPhoto[0].path);
          // Clean up local file
          fs.unlink(req.files.passportPhoto[0].path, () => {});
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      }

      let idProofUrl = null;
      if (req.files.idProof) {
        try {
          idProofUrl = await uploadImage(req.files.idProof[0].path);
          // Clean up local file
          fs.unlink(req.files.idProof[0].path, () => {});
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      }

      // 3. Create Employee
      const newEmployee = await Prisma.employee.create({
        data: {
          hostelId: hostelId,
          name,
          email: email || null,
          phone,
          address: address || null,
          gender: gender || null,
          role,
          salary: salary ? parseFloat(salary) : null,
          dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
          photoUrl: photoUrl,
          idProofUrl: idProofUrl,
        },
      });

      res.status(201).json({
        message: "Staff member added successfully",
        employee: newEmployee,
      });
    } catch (error) {
      console.error("Add Staff Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ==========================
// 1. GET SINGLE STAFF DETAILS
// ==========================
employeeRouter.get("/staff-details/:id", authMiddleware, async (req, res) => {
  try {
    const staffId = parseInt(req.params.id);

    // Dynamic Filter: Super Admin searches globally; Normal Admin restricted to their hostel
    const whereClause = req.user.isSuperAdmin
      ? { id: staffId } // Super Admin: Just find by ID
      : { id: staffId, hostelId: req.user.id }; // Normal Admin: Must match ID AND Hostel ID

    const employee = await Prisma.employee.findFirst({
      where: whereClause,
    });

    if (!employee) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.status(200).json({ employee });
  } catch (error) {
    console.error("Get Staff Detail Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 2. GET ALL STAFF LIST
// ==========================
employeeRouter.get("/all-staff", authMiddleware, async (req, res) => {
  try {
    // Dynamic Filter: Super Admin gets ALL; Normal Admin gets theirs
    const whereClause = req.user.isSuperAdmin
      ? {} // Super Admin: No filter (Fetch all employees)
      : { hostelId: req.user.id }; // Normal Admin: Only their employees

    const staffList = await Prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        photoUrl: true,
        salary: true,
        hostelId: true, // Useful for Super Admin to know which hostel they belong to
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      count: staffList.length,
      staff: staffList,
    });
  } catch (error) {
    console.error("Get Staff List Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 3. UPDATE STAFF
// ==========================
employeeRouter.put(
  "/update-staff/:id",
  authMiddleware,
  uploadFields,
  async (req, res) => {
    try {
      const staffId = parseInt(req.params.id);

      // 1. Verify Existence & Ownership
      const whereClause = req.user.isSuperAdmin
        ? { id: staffId }
        : { id: staffId, hostelId: req.user.id };

      const existingStaff = await Prisma.employee.findFirst({
        where: whereClause,
      });

      if (!existingStaff) {
        return res
          .status(404)
          .json({ message: "Staff not found or access denied" });
      }

      // 2. Handle Image Upload
      let newPhotoUrl = null;
      if (req.files.passportPhoto) {
        newPhotoUrl = await uploadImage(req.files.passportPhoto[0].path);
        fs.unlink(req.files.passportPhoto[0].path, () => {});
      }

      let newIdProofUrl = null;
      if (req.files.idProof) {
        newIdProofUrl = await uploadImage(req.files.idProof[0].path);
        fs.unlink(req.files.idProof[0].path, () => {});
      }

      // 3. Prepare Update Data
      const {
        name,
        email,
        phone,
        address,
        gender,
        role,
        salary,
        dateOfJoining,
      } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (gender) updateData.gender = gender;
      if (role) updateData.role = role;
      if (salary) updateData.salary = parseFloat(salary);
      if (dateOfJoining) updateData.dateOfJoining = new Date(dateOfJoining);
      if (newPhotoUrl) updateData.photoUrl = newPhotoUrl;
      if (newIdProofUrl) updateData.idProofUrl = newIdProofUrl;

      // 4. Update DB
      const updatedStaff = await Prisma.employee.update({
        where: { id: staffId },
        data: updateData,
      });

      res.status(200).json({
        message: "Staff details updated successfully",
        employee: updatedStaff,
      });
    } catch (error) {
      console.error("Update Staff Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ==========================
// 4. DELETE STAFF
// ==========================
employeeRouter.delete("/delete-staff/:id", authMiddleware, async (req, res) => {
  try {
    const staffId = parseInt(req.params.id);

    // 1. Verify Existence & Ownership
    const whereClause = req.user.isSuperAdmin
      ? { id: staffId }
      : { id: staffId, hostelId: req.user.id };

    const employee = await Prisma.employee.findFirst({
      where: whereClause,
    });

    if (!employee) {
      return res
        .status(404)
        .json({ message: "Staff member not found or access denied" });
    }

    // 2. Delete Image from Cloudinary (if exists)
    if (employee.photoUrl) {
      await deleteImage(employee.photoUrl);
    }

    // 3. Delete from DB
    await Prisma.employee.delete({
      where: { id: staffId },
    });

    res.status(200).json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Delete Staff Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default employeeRouter;
