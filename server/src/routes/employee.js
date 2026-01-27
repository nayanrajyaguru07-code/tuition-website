import express from "express";
import multer from "multer";
import fs from "fs";
import Prisma from "../lib/prisma.js";
import { uploadImage, deleteImage } from "../utils/uploadImage.js";

const employeeRouter = express.Router();

// Multer Setup for temporary storage
const upload = multer({ dest: "uploads/" });

// ==========================
// 1. ADD STAFF (POST)
// ==========================
employeeRouter.post("/add-staff", upload.single("photo"), async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const { name, email, phone, address, gender, role, salary, dateOfJoining } =
      req.body;

    // 1. Validation
    if (!name || !phone || !role) {
      return res
        .status(400)
        .json({ message: "Name, Phone, and Role are required" });
    }

    // 2. Image Upload (if provided)
    let photoUrl = null;
    if (req.file) {
      try {
        photoUrl = await uploadImage(req.file.path);
        // Clean up local file
        fs.unlink(req.file.path, () => {});
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
});

// ==========================
// 2. LIST OF STAFF (GET)
// ==========================
// Returns a lightweight list for your dashboard
employeeRouter.get("/all-staff", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const staffList = await Prisma.employee.findMany({
      where: { hostelId: hostelId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true, // Role is usually important for the list view
        photoUrl: true, // Nice to have for avatars
        salary: true,
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
// 3. STAFF DETAILS (GET)
// ==========================
// Returns full profile of one employee
employeeRouter.get("/staff-details/:id", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const staffId = parseInt(req.params.id);

    const employee = await Prisma.employee.findFirst({
      where: {
        id: staffId,
        hostelId: hostelId,
      },
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
// 4. UPDATE STAFF (PUT)
// ==========================
employeeRouter.put(
  "/update-staff/:id",
  upload.single("photo"),
  async (req, res) => {
    try {
      // const hostelId = req.user.id;
      const hostelId = 1;

      const staffId = parseInt(req.params.id);

      // 1. Verify Existence & Ownership
      const existingStaff = await Prisma.employee.findFirst({
        where: { id: staffId, hostelId: hostelId },
      });

      if (!existingStaff) {
        return res.status(404).json({ message: "Staff not found" });
      }

      // 2. Handle Image Upload
      let newPhotoUrl = null;
      if (req.file) {
        newPhotoUrl = await uploadImage(req.file.path);
        fs.unlink(req.file.path, () => {});
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
      if (newPhotoUrl) updateData.photoUrl = newPhotoUrl; // Only update if new photo exists

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
// 5. DELETE STAFF (DELETE)
// ==========================
employeeRouter.delete("/delete-staff/:id", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const staffId = parseInt(req.params.id);

    // 1. Verify Existence & Ownership
    const employee = await Prisma.employee.findFirst({
      where: { id: staffId, hostelId: hostelId },
    });

    if (!employee) {
      return res.status(404).json({ message: "Staff member not found" });
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
