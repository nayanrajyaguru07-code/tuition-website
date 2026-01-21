import express from "express";
import multer from "multer";
import fs from "fs";
import Prisma from "../lib/prisma.js";
import { uploadImage, deleteImage } from "../utils/uploadImage.js"; // Your provided helper

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
studentRouter.post("/add-student", uploadFields, async (req, res) => {
  try {
    //   const userId = req.user.id; // From token (Hostel ID)
    const userId = 1; // From token (Hostel ID)

    // 1. Upload Images to Cloudinary
    // We run these in parallel for speed
    const [passportPhotoUrl, idProofUrl, admissionProofUrl, parentIdProofUrl] =
      await Promise.all([
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
});

// ==========================
// UPDATE STUDENT ROUTE (PUT)
// ==========================
studentRouter.put("/update-student/:id", uploadFields, async (req, res) => {
  try {
    // const hostelId = req.user.id; // From token
    const hostelId = 1;
    const studentId = parseInt(req.params.id);

    // 1. Verify Student Exists & Belongs to this Hostel
    // We must fetch the student first to check ownership
    const existingStudent = await Prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (existingStudent.hostelId !== hostelId) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You cannot edit this student" });
    }

    // 2. Handle New File Uploads (if any)
    // If the user didn't upload a file, these variables will be null
    const [newPassportPhoto, newIdProof, newAdmissionProof, newParentIdProof] =
      await Promise.all([
        handleFileUpload(req.files, "passportPhoto"),
        handleFileUpload(req.files, "idProof"),
        handleFileUpload(req.files, "admissionProof"),
        handleFileUpload(req.files, "parentIdProof"),
      ]);

    // 3. Prepare Update Data Object
    // We only add fields to 'updateData' if they are present in the request body
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
    if (emergencyContactNo) updateData.emergencyContactNo = emergencyContactNo;
    if (permanentAddress) updateData.permanentAddress = permanentAddress;
    if (schoolCollegeName) updateData.schoolCollegeName = schoolCollegeName;
    if (courseClassYear) updateData.courseClassYear = courseClassYear;

    // Only update image URLs if a NEW file was uploaded
    if (newPassportPhoto) updateData.passportPhotoUrl = newPassportPhoto;
    if (newIdProof) updateData.idProofUrl = newIdProof;
    if (newAdmissionProof) updateData.admissionProofUrl = newAdmissionProof;
    if (newParentIdProof) updateData.parentIdProofUrl = newParentIdProof;

    // 4. Update Database
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

    // Handle Email Conflict (if user tries to update email to one that already exists)
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Email already in use by another student." });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// GET ALL STUDENTS (List View)
// ==========================
studentRouter.get("/all-students", async (req, res) => {
  try {
    // const hostelId = req.user.id; // From token
    const hostelId = 1;

    // Fetch only specific fields for the list view
    const students = await Prisma.student.findMany({
      where: {
        hostelId: hostelId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        studentMobileNo: true,
        // Including photoUrl might be nice for a list avatar, but optional
        passportPhotoUrl: true,
      },
      orderBy: {
        createdAt: "desc", // Show newest students first
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
studentRouter.get("/get-student/:id", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;
    const studentId = parseInt(req.params.id);

    if (isNaN(studentId)) {
      return res.status(400).json({ message: "Invalid Student ID" });
    }

    // We use findFirst instead of findUnique here.
    // This allows us to filter by BOTH id AND hostelId simultaneously.
    // If a student exists but belongs to a different hostel, this returns null (secure).
    const student = await Prisma.student.findFirst({
      where: {
        id: studentId,
        hostelId: hostelId,
      },
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
studentRouter.delete("/delete-student/:id", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;
    const studentId = parseInt(req.params.id);

    // 1. Find Student (Security Check)
    const student = await Prisma.student.findFirst({
      where: {
        id: studentId,
        hostelId: hostelId,
      },
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "Student not found or access denied" });
    }

    // 2. Delete Images from Cloudinary
    // We do this concurrently for better performance
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
});

export default studentRouter;
