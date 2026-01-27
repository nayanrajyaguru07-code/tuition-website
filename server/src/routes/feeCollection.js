import express from "express";
import Prisma from "../lib/prisma.js";

const feeCollectionRouter = express.Router();

// ==========================
// COLLECT FEE (POST)
// ==========================
feeCollectionRouter.post("/collect-fee", async (req, res) => {
  try {
    // const hostelId = req.user.id; // Logged-in Hostel ID
    const hostelId = 1;

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

    // 2. Verify Student Belongs to this Hostel
    const student = await Prisma.student.findFirst({
      where: {
        id: parseInt(studentId),
        hostelId: hostelId,
      },
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found or does not belong to your hostel",
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
        hostelId: hostelId,
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
feeCollectionRouter.get("/fee-history", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const history = await Prisma.feeCollection.findMany({
      where: {
        hostelId: hostelId,
      },
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
feeCollectionRouter.delete("/delete-fee/:id", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const feeId = parseInt(req.params.id);

    // 1. Check if record exists and belongs to this hostel
    const existingRecord = await Prisma.feeCollection.findFirst({
      where: {
        id: feeId,
        hostelId: hostelId,
      },
    });

    if (!existingRecord) {
      return res
        .status(404)
        .json({ message: "Fee record not found or access denied" });
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
});

// ==========================
// EDIT FEE RECORD (PUT)
// ==========================
feeCollectionRouter.put("/update-fee-record/:id", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const feeId = parseInt(req.params.id);
    const { amount, paymentMethod, transactionId, remarks, paymentDate } =
      req.body;

    // 1. Check if record exists and belongs to this hostel
    const existingRecord = await Prisma.feeCollection.findFirst({
      where: {
        id: feeId,
        hostelId: hostelId,
      },
    });

    if (!existingRecord) {
      return res
        .status(404)
        .json({ message: "Fee record not found or access denied" });
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
});

// ==========================
// GET SINGLE STUDENT FEE HISTORY
// ==========================
feeCollectionRouter.get("/student-fee-history/:studentId", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const studentId = parseInt(req.params.studentId);

    if (isNaN(studentId)) {
      return res.status(400).json({ message: "Invalid Student ID" });
    }

    // 1. Verify Student Exists & Belongs to Hostel
    const student = await Prisma.student.findFirst({
      where: { id: studentId, hostelId: hostelId },
      select: { fullName: true, studentMobileNo: true },
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "Student not found or access denied" });
    }

    // 2. Fetch Fee Records
    const feeRecords = await Prisma.feeCollection.findMany({
      where: {
        studentId: studentId,
        hostelId: hostelId, // Redundant safety check, but good practice
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
});

// ==========================
// GET STUDENT FEE STATUS (Total, Paid, Due)
// ==========================
feeCollectionRouter.get("/student-fee-status/:studentId", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const studentId = parseInt(req.params.studentId);

    if (isNaN(studentId)) {
      return res.status(400).json({ message: "Invalid Student ID" });
    }

    // 1. Get Hostel Details (to find the Total Fee)
    const hostel = await Prisma.hostel.findUnique({
      where: { id: hostelId },
      select: { fee: true }, // We only need the fee column
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // 2. Get Student Details (Name, etc.)
    const student = await Prisma.student.findFirst({
      where: { id: studentId, hostelId: hostelId },
      select: { id: true, fullName: true, studentMobileNo: true },
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "Student not found or access denied" });
    }

    // 3. Calculate Total Paid (Sum of all records)
    const paymentStats = await Prisma.feeCollection.aggregate({
      where: {
        studentId: studentId,
        hostelId: hostelId,
      },
      _sum: {
        amount: true,
      },
    });

    // Handle null values (if no fee set or no payments made)
    const totalFee = hostel.fee || 0;
    const totalPaid = paymentStats._sum.amount || 0;
    const dueFee = totalFee - totalPaid;

    res.status(200).json({
      student: student,
      feeStatus: {
        totalFee: totalFee, // From Hostel Table
        totalPaid: totalPaid, // Sum of collected fees
        dueFee: dueFee, // Calculated Balance
      },
    });
  } catch (error) {
    console.error("Get Fee Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default feeCollectionRouter;
