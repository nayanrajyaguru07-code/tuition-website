import express from "express";
import Prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/authMiddleware.js";

const contactRouter = express.Router();

// GET /api/contacts/all
contactRouter.get("/all", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;
    // const hostelId = 1;

    // 1. Fetch Students (Student & Parent data comes from here)
    const students = await Prisma.student.findMany({
      where: {
        hostelId: hostelId,
      },
      select: {
        id: true,
        fullName: true,
        studentMobileNo: true,
        fatherName: true,
        fatherPhoneNo: true,
        courseClassYear: true,
      },
    });

    // 2. Fetch Staff
    const staff = await Prisma.employee.findMany({
      where: {
        hostelId: hostelId,
      },
      select: {
        id: true,
        name: true,
        phone: true, // ✅ Schema uses 'phone'
        role: true,
      },
    });

    // --- 3. Construct the 3 Separate Arrays ---

    // Array 1: Students
    const studentList = students
      .filter((s) => s.studentMobileNo) // Only include if mobile exists
      .map((student) => ({
        id: student.id,
        name: student.fullName,
        mobile: student.studentMobileNo,
        // description: `Course: ${student.courseClassYear || "N/A"}`,
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
        // description: `Parent of: ${student.fullName}`,
      }));

    // Array 3: Staff
    const staffList = staff
      .filter((m) => m.phone) // Only include if phone exists
      .map((member) => ({
        id: member.id,
        name: member.name,
        mobile: member.phone, // ✅ FIXED: Changed 'member.mobile' to 'member.phone'
        // description: member.role || "Staff Member",
        role: member.role || "Staff Member",
      }));

    // 4. Send response with 3 distinct keys
    res.status(200).json({
      success: true,
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
