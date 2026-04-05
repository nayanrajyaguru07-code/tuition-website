import express from "express";
import multer from "multer";
import fs from "fs";
import Prisma from "../lib/prisma.js";
import { uploadImage, deleteImage } from "../utils/uploadImage.js"; // Your provided helper
import authMiddleware from "../middleware/authMiddleware.js";

const studentRouter = express.Router();

// --- 1. Multer Setup for Temporary Storage ---
const upload = multer({ dest: "uploads/" });

// Define which fields in the form contain files
const uploadFields = upload.fields([
  { name: "passportPhoto", maxCount: 1 },
  { name: "idProof", maxCount: 1 },
  { name: "admissionProof", maxCount: 1 },
  { name: "parentIdProof", maxCount: 1 },
]);

// --- 2. Helper to Upload and Clean up ---
const handleFileUpload = async (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    const filePath = files[fieldName][0].path;
    try {
      const url = await uploadImage(filePath); // Your cloudinary function

      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete temp file: ${filePath}`);
      });

      return url;
    } catch (error) {
      console.error(`Upload failed for ${fieldName}:`, error);
      return null;
    }
  }
  return null;
};

// ==========================
// ADD STUDENT ROUTE
// ==========================
studentRouter.post(
  "/add-student",
  uploadFields,
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id; // From token (Hostel ID)

      // 1. Upload Images to Cloudinary
      // We run these in parallel for speed
      const [
        passportPhotoUrl,
        idProofUrl,
        admissionProofUrl,
        parentIdProofUrl,
      ] = await Promise.all([
        handleFileUpload(req.files, "passportPhoto"),
        handleFileUpload(req.files, "idProof"),
        handleFileUpload(req.files, "admissionProof"),
        handleFileUpload(req.files, "parentIdProof"),
      ]);

      // 2. Destructure Body Fields
      // Note: Multer puts text fields in req.body
      const {
        fullName,
        fatherName,
        dob,
        age,
        gender,
        nationality,
        category,
        studentMobileNo,
        email,
        fatherPhoneNo,
        emergencyContactNo,
        permanentAddress,
        schoolCollegeName,
        courseClassYear,
        roomId,
      } = req.body;

      // 3. Validation for Required Fields
      // (Prisma will throw error if required fields are missing, but manual check is friendlier)
      if (!fullName || !email || !studentMobileNo) {
        return res
          .status(400)
          .json({ message: "Full Name, Email, and Mobile No are mandatory." });
      }

      // 4. Create Student in DB
      const newStudent = await Prisma.student.create({
        data: {
          // --- Relations ---
          hostelId: userId,

          // --- Personal Details ---
          fullName,
          fatherName,
          // Parse DOB string to Date object
          dob: new Date(dob),
          // Ensure age is an Integer
          age: parseInt(age),
          gender,
          // Handle optional/default values for nationality
          nationality: nationality || "Indian",
          category: category || null,

          // --- Contact Details ---
          studentMobileNo,
          email,
          fatherPhoneNo,
          emergencyContactNo,
          permanentAddress,

          // --- Academic Details ---
          schoolCollegeName,
          courseClassYear,

          // --- Room Allocation ---
          roomId: roomId ? parseInt(roomId) : null,

          // --- File URLs (from Cloudinary) ---
          passportPhotoUrl,
          idProofUrl,
          admissionProofUrl,
          parentIdProofUrl,
        },
      });

      res.status(201).json({
        message: "Student added successfully",
        student: newStudent,
      });
    } catch (error) {
      console.error("Add Student Error:", error);

      // Handle Unique Constraint (e.g., Email already exists)
      if (error.code === "P2002") {
        return res
          .status(400)
          .json({ message: "A student with this email already exists." });
      }

      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ==========================
// UPDATE STUDENT ROUTE (PUT)
// ==========================
studentRouter.put(
  "/update-student/:id",
  uploadFields,
  authMiddleware,
  async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);

      // 1. Verify Student Exists
      const existingStudent = await Prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }

      // 2. PERMISSION CHECK
      // If NOT Super Admin AND the student belongs to a different hostel -> Block access
      if (!req.user.isSuperAdmin && existingStudent.hostelId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Unauthorized: You cannot edit this student" });
      }

      // 3. Handle New File Uploads (if any)
      const [
        newPassportPhoto,
        newIdProof,
        newAdmissionProof,
        newParentIdProof,
      ] = await Promise.all([
        handleFileUpload(req.files, "passportPhoto"),
        handleFileUpload(req.files, "idProof"),
        handleFileUpload(req.files, "admissionProof"),
        handleFileUpload(req.files, "parentIdProof"),
      ]);

      // 4. Prepare Update Data Object
      const {
        fullName,
        fatherName,
        dob,
        age,
        gender,
        nationality,
        category,
        studentMobileNo,
        email,
        fatherPhoneNo,
        emergencyContactNo,
        permanentAddress,
        schoolCollegeName,
        courseClassYear,
        roomId,
      } = req.body;

      const updateData = {};

      if (fullName) updateData.fullName = fullName;
      if (fatherName) updateData.fatherName = fatherName;
      if (dob) updateData.dob = new Date(dob);
      if (age) updateData.age = parseInt(age);
      if (gender) updateData.gender = gender;
      if (nationality) updateData.nationality = nationality;
      if (category) updateData.category = category;
      if (studentMobileNo) updateData.studentMobileNo = studentMobileNo;
      if (email) updateData.email = email;
      if (fatherPhoneNo) updateData.fatherPhoneNo = fatherPhoneNo;
      if (emergencyContactNo)
        updateData.emergencyContactNo = emergencyContactNo;
      if (permanentAddress) updateData.permanentAddress = permanentAddress;
      if (schoolCollegeName) updateData.schoolCollegeName = schoolCollegeName;
      if (courseClassYear) updateData.courseClassYear = courseClassYear;
      if (typeof roomId !== "undefined") {
        updateData.roomId = roomId ? parseInt(roomId) : null;
      }

      if (newPassportPhoto) updateData.passportPhotoUrl = newPassportPhoto;
      if (newIdProof) updateData.idProofUrl = newIdProof;
      if (newAdmissionProof) updateData.admissionProofUrl = newAdmissionProof;
      if (newParentIdProof) updateData.parentIdProofUrl = newParentIdProof;

      // 5. Update Database
      const updatedStudent = await Prisma.student.update({
        where: { id: studentId },
        data: updateData,
      });

      res.status(200).json({
        message: "Student details updated successfully",
        student: updatedStudent,
      });
    } catch (error) {
      console.error("Update Student Error:", error);
      if (error.code === "P2002") {
        return res
          .status(400)
          .json({ message: "Email already in use by another student." });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ==========================
// GET ALL STUDENTS (List View)
// ==========================
studentRouter.get("/all-students", authMiddleware, async (req, res) => {
  try {
    // Dynamic Filter: Super Admin gets ALL; Normal Admin gets theirs
    const whereClause = req.user.isSuperAdmin
      ? {} // Empty = Fetch All
      : { hostelId: req.user.id }; // Filter by Hostel ID

    const students = await Prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        studentMobileNo: true,
        passportPhotoUrl: true,
        hostelId: true, // Useful for Super Admin to identify student's hostel
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get All Students Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// GET SINGLE STUDENT (Full Details)
// ==========================
studentRouter.get("/get-student/:id", authMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    if (isNaN(studentId)) {
      return res.status(400).json({ message: "Invalid Student ID" });
    }

    // Dynamic Filter: Super Admin searches globally; Normal Admin restricted
    const whereClause = req.user.isSuperAdmin
      ? { id: studentId }
      : { id: studentId, hostelId: req.user.id };

    const student = await Prisma.student.findFirst({
      where: whereClause,
      include: { room: true },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ student });
  } catch (error) {
    console.error("Get Single Student Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// DELETE STUDENT ROUTE
// ==========================
studentRouter.delete(
  "/delete-student/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);

      // 1. Find Student & Check Permissions
      const whereClause = req.user.isSuperAdmin
        ? { id: studentId }
        : { id: studentId, hostelId: req.user.id };

      const student = await Prisma.student.findFirst({
        where: whereClause,
      });

      if (!student) {
        return res
          .status(404)
          .json({ message: "Student not found or access denied" });
      }

      // 2. Delete Images from Cloudinary
      await Promise.all([
        deleteImage(student.passportPhotoUrl),
        deleteImage(student.idProofUrl),
        deleteImage(student.admissionProofUrl),
        deleteImage(student.parentIdProofUrl),
      ]);

      // 3. Delete Student from Database
      await Prisma.student.delete({
        where: { id: studentId },
      });

      res
        .status(200)
        .json({ message: "Student and associated files deleted successfully" });
    } catch (error) {
      console.error("Delete Student Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default studentRouter;
