import express from "express";
import Prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/authMiddleware.js";

const contactRouter = express.Router();

// GET /api/contacts/all
contactRouter.get("/all", authMiddleware, async (req, res) => {
  try {
    // 1️⃣ Dynamic Filter Logic
    let whereClause = {};

    // If NOT Super Admin, filter by their specific Hostel ID
    if (!req.user.isSuperAdmin) {
      whereClause = { hostelId: req.user.id };
    }
    // If Super Admin, 'whereClause' remains empty {}, fetching ALL data

    // 2️⃣ Fetch Students (Apply Filter)
    const students = await Prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        studentMobileNo: true,
        fatherName: true,
        fatherPhoneNo: true,
        courseClassYear: true,
      },
    });

    // 3️⃣ Fetch Staff (Apply Filter)
    const staff = await Prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        phone: true, // ✅ Schema uses 'phone'
        role: true,
      },
    });

    // --- 4. Construct the 3 Separate Arrays ---

    // Array 1: Students
    const studentList = students
      .filter((s) => s.studentMobileNo) // Only include if mobile exists
      .map((student) => ({
        id: student.id,
        name: student.fullName,
        mobile: student.studentMobileNo,
        course: student.courseClassYear,
      }));

    // Array 2: Parents
    const parentList = students
      .filter((s) => s.fatherPhoneNo) // Only include if father's phone exists
      .map((student) => ({
        id: student.id, // Linking parent ID to student ID
        name: student.fatherName,
        childName: student.fullName, // Helpful to know which student belongs to this parent
        mobile: student.fatherPhoneNo,
      }));

    // Array 3: Staff
    const staffList = staff
      .filter((m) => m.phone) // Only include if phone exists
      .map((member) => ({
        id: member.id,
        name: member.name,
        mobile: member.phone, // ✅ FIXED: Changed 'member.mobile' to 'member.phone'
        role: member.role || "Staff Member",
      }));

    // 5. Send response with 3 distinct keys
    res.status(200).json({
      success: true,
      isSuperAdmin: req.user.isSuperAdmin, // Useful for frontend debugging
      counts: {
        students: studentList.length,
        parents: parentList.length,
        staff: staffList.length,
      },
      data: {
        students: studentList,
        parents: parentList,
        staff: staffList,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch contacts" });
  }
});

export default contactRouter;
