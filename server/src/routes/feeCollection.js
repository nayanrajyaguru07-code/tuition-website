import express from "express";
import Prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/authMiddleware.js";

const feeCollectionRouter = express.Router();

// ==========================
// COLLECT FEE (POST)
// ==========================
feeCollectionRouter.post("/collect-fee", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id; // Logged-in Hostel ID
    // const hostelId = 1;

    const {
      studentId,
      amount,
      paymentDate,
      paymentMethod,
      transactionId,
      remarks,
    } = req.body;

    // 1. Basic Validation
    if (!studentId || !amount || !paymentMethod) {
      return res.status(400).json({
        message: "Student ID, Amount, and Payment Method are required",
      });
    }

    // 2. Verify Student Exists
    const student = await Prisma.student.findUnique({
      where: {
        id: parseInt(studentId),
      },
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // 2b. Permission Check
    if (!req.user.isSuperAdmin && student.hostelId !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized: You do not own this student",
      });
    }

    // 3. Create Fee Collection Record
    const feeRecord = await Prisma.feeCollection.create({
      data: {
        amount: parseFloat(amount),
        paymentMethod,
        transactionId: transactionId || null,
        remarks: remarks || null,
        // Allow backdating if paymentDate is provided, else default to now
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),

        // Foreign Keys
        studentId: parseInt(studentId),
        hostelId: student.hostelId, // ✅ Use the student's actual hostelId
      },
    });

    res.status(201).json({
      message: "Fee collected successfully",
      data: feeRecord,
    });
  } catch (error) {
    console.error("Collect Fee Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// GET FEE HISTORY
// ==========================
feeCollectionRouter.get("/fee-history", authMiddleware, async (req, res) => {
  try {
    // Dynamic Filter: Super Admin gets ALL; Normal Admin gets theirs
    const whereClause = req.user.isSuperAdmin
      ? {} // Empty = Fetch All records
      : { hostelId: req.user.id };

    const history = await Prisma.feeCollection.findMany({
      where: whereClause,
      // Join with Student table to get name and mobile
      include: {
        student: {
          select: {
            fullName: true,
            studentMobileNo: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Newest payments first
      },
    });

    // Transform the data to match your specific requirement
    const formattedHistory = history.map((record) => ({
      id: record.id,
      studentName: record.student.fullName,
      mobileNo: record.student.studentMobileNo,
      amount: record.amount,
      paymentMethod: record.paymentMethod,
      feeAddDate: record.paymentDate, // Or record.createdAt if you prefer entry time
      feeRemark: record.remarks,
    }));

    res.status(200).json({
      count: formattedHistory.length,
      history: formattedHistory,
    });
  } catch (error) {
    console.error("Get Fee History Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// DELETE FEE RECORD
// ==========================
feeCollectionRouter.delete(
  "/delete-fee/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const hostelId = req.user.id;
      // const hostelId = 1;

      const feeId = parseInt(req.params.id);

      // 1. Check if record exists
      const existingRecord = await Prisma.feeCollection.findUnique({
        where: { id: feeId },
      });

      if (!existingRecord) {
        return res.status(404).json({ message: "Fee record not found" });
      }

      // 1b. Permission Check
      if (!req.user.isSuperAdmin && existingRecord.hostelId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized: Access denied" });
      }

      // 2. Delete the record
      await Prisma.feeCollection.delete({
        where: { id: feeId },
      });

      res.status(200).json({ message: "Fee record deleted successfully" });
    } catch (error) {
      console.error("Delete Fee Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ==========================
// EDIT FEE RECORD (PUT)
// ==========================
feeCollectionRouter.put(
  "/update-fee-record/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const hostelId = req.user.id;
      // const hostelId = 1;

      const feeId = parseInt(req.params.id);
      const { amount, paymentMethod, transactionId, remarks, paymentDate } =
        req.body;

      // 1. Check if record exists
      const existingRecord = await Prisma.feeCollection.findUnique({
        where: { id: feeId },
      });

      if (!existingRecord) {
        return res.status(404).json({ message: "Fee record not found" });
      }

      // 1b. Permission Check
      if (!req.user.isSuperAdmin && existingRecord.hostelId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized: Access denied" });
      }

      // 2. Prepare Update Data
      const updateData = {};
      if (amount) updateData.amount = parseFloat(amount);
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
      if (remarks !== undefined) updateData.remarks = remarks; // Allow clearing remarks
      if (transactionId !== undefined) updateData.transactionId = transactionId;
      if (paymentDate) updateData.paymentDate = new Date(paymentDate);

      // 3. Update the record
      const updatedRecord = await Prisma.feeCollection.update({
        where: { id: feeId },
        data: updateData,
      });

      res.status(200).json({
        message: "Fee record updated successfully",
        data: updatedRecord,
      });
    } catch (error) {
      console.error("Update Fee Record Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ==========================
// GET SINGLE STUDENT FEE HISTORY
// ==========================
feeCollectionRouter.get(
  "/student-fee-history/:studentId",
  authMiddleware,
  async (req, res) => {
    try {
      const hostelId = req.user.id;
      // const hostelId = 1;

      const studentId = parseInt(req.params.studentId);

      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid Student ID" });
      }

      // 1. Verify Student Exists
      const student = await Prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, fullName: true, studentMobileNo: true, hostelId: true },
      });

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // 1b. Permission Check
      if (!req.user.isSuperAdmin && student.hostelId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized: Access denied" });
      }

      // 2. Fetch Fee Records
      const feeRecords = await Prisma.feeCollection.findMany({
        where: {
          studentId: studentId,
          // hostelId: hostelId, // No longer strictly needed but could be added if we want to be paranoid
        },
        orderBy: {
          paymentDate: "desc", // Show newest payments first
        },
      });

      // 3. Calculate Total Paid
      // Use .reduce to sum up the 'amount' field
      const totalPaid = feeRecords.reduce(
        (sum, record) => sum + record.amount,
        0,
      );

      res.status(200).json({
        student: student,
        totalPaid: totalPaid,
        count: feeRecords.length,
        history: feeRecords,
      });
    } catch (error) {
      console.error("Get Student Fee History Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ==========================
// GET STUDENT FEE STATUS (Total, Paid, Due)
// ==========================
feeCollectionRouter.get(
  "/student-fee-status/:studentId",
  authMiddleware,
  async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);

      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid Student ID" });
      }

      // 1. Fetch Student First
      // We need to fetch the student first to know their 'hostelId'.
      // This allows the Super Admin to look up the correct hostel fee.
      const student = await Prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          fullName: true,
          studentMobileNo: true,
          hostelId: true, // ✅ Needed to find the correct hostel fee
        },
      });

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // 2. PERMISSION CHECK
      // If the user is NOT a Super Admin, they must own this student.
      if (!req.user.isSuperAdmin && student.hostelId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized: Access denied" });
      }

      // 3. Identify Target Hostel ID
      // We use the student's actual hostelId (retrieved above)
      const targetHostelId = student.hostelId;

      // 4. Get Hostel Details (to find the Total Fee)
      const hostel = await Prisma.hostel.findUnique({
        where: { id: targetHostelId },
        select: { fee: true },
      });

      if (!hostel) {
        return res.status(404).json({ message: "Associated Hostel not found" });
      }

      // 5. Calculate Total Paid (Sum of all records)
      const paymentStats = await Prisma.feeCollection.aggregate({
        where: {
          studentId: studentId,
          hostelId: targetHostelId,
        },
        _sum: {
          amount: true,
        },
      });

      // 6. Final Calculations
      const totalFee = hostel.fee || 0;
      const totalPaid = paymentStats._sum.amount || 0;
      const dueFee = totalFee - totalPaid;

      res.status(200).json({
        student: {
          id: student.id,
          fullName: student.fullName,
          studentMobileNo: student.studentMobileNo,
        },
        feeStatus: {
          totalFee: totalFee,
          totalPaid: totalPaid,
          dueFee: dueFee,
        },
      });
    } catch (error) {
      console.error("Get Fee Status Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default feeCollectionRouter;
