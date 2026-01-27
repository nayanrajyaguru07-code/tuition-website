import express from "express";
const dashboardRouter = express.Router();
import Prisma from "../lib/prisma.js";

// ==========================
// 1. DASHBOARD COUNTS (Cards)
// ==========================
dashboardRouter.get("/stats/counts", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    // Run queries in parallel for speed
    const [studentCount, staffCount] = await Promise.all([
      Prisma.student.count({ where: { hostelId } }),
      Prisma.employee.count({ where: { hostelId } }),
    ]);

    res.status(200).json({
      totalStudents: studentCount,
      totalStaff: staffCount,
    });
  } catch (error) {
    console.error("Dashboard Counts Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 2. MONTHLY FINANCIAL SUMMARY (Chart Data)
// ==========================
dashboardRouter.get("/stats/monthly-finance", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    // 1. Define Date Range (e.g., Start of current year or last 6 months)
    // For simplicity, let's fetch all data for the current year
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);

    // 2. Fetch Data
    const [feeCollections, salaryPayments, expenses] = await Promise.all([
      // Income
      Prisma.feeCollection.findMany({
        where: { hostelId, paymentDate: { gte: startDate } },
        select: { amount: true, paymentDate: true },
      }),
      // Expense 1: Salaries
      Prisma.salaryPayment.findMany({
        where: { hostelId, paymentDate: { gte: startDate } },
        select: { amount: true, paymentDate: true },
      }),
      // Expense 2: General Expenses
      Prisma.expense.findMany({
        where: { hostelId, expenseDate: { gte: startDate } },
        select: { amount: true, expenseDate: true },
      }),
    ]);

    // 3. Aggregate Data by Month in JavaScript
    // Helper to get "Jan 2026" key
    const getMonthKey = (date) => {
      const d = new Date(date);
      return d.toLocaleString("default", { month: "short", year: "numeric" });
    };

    const monthlyData = {};

    // Process Income (Fees)
    feeCollections.forEach((record) => {
      const key = getMonthKey(record.paymentDate);
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      monthlyData[key].income += record.amount;
    });

    // Process Expenses (Salaries)
    salaryPayments.forEach((record) => {
      const key = getMonthKey(record.paymentDate);
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      monthlyData[key].expense += record.amount;
    });

    // Process Expenses (General)
    expenses.forEach((record) => {
      const key = getMonthKey(record.expenseDate);
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      monthlyData[key].expense += record.amount;
    });

    // 4. Convert Object to Array for Frontend Chart
    // e.g. [{ month: "Jan 2026", income: 5000, expense: 2000 }, ...]
    const chartData = Object.keys(monthlyData).map((month) => ({
      month,
      income: monthlyData[month].income,
      expense: monthlyData[month].expense,
    }));

    res.status(200).json({ chartData });
  } catch (error) {
    console.error("Financial Stats Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 3. RECOMMENDED: THIS MONTH'S RECOVERY
// ==========================
// Shows how much fee is collected vs pending for the CURRENT MONTH only
dashboardRouter.get("/stats/current-month-recovery", async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 1. Total Collectable (Total Students * Fee per Student)
    const hostel = await Prisma.hostel.findUnique({
      where: { id: hostelId },
      include: { _count: { select: { students: true } } },
    });

    const totalStudents = hostel._count.students;
    const feePerStudent = hostel.fee || 0;
    const expectedRevenue = totalStudents * feePerStudent;

    // 2. Actually Collected This Month
    const collectedThisMonth = await Prisma.feeCollection.aggregate({
      where: {
        hostelId,
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    const collectedAmount = collectedThisMonth._sum.amount || 0;
    const pendingAmount = expectedRevenue - collectedAmount;

    res.status(200).json({
      month: now.toLocaleString("default", { month: "long" }),
      expected: expectedRevenue,
      collected: collectedAmount,
      pending: pendingAmount > 0 ? pendingAmount : 0,
    });
  } catch (error) {
    console.error("Recovery Stats Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default dashboardRouter;
