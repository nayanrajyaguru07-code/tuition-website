import express from "express";
const dashboardRouter = express.Router();
import Prisma from "../lib/prisma.js";

// ==========================
// 1. DASHBOARD COUNTS (Cards)
// ==========================
dashboardRouter.get("/stats/counts", async (req, res) => {
  try {
    const { hostelId } = req.query;
    const where =
      hostelId && hostelId !== "all" ? { hostelId: parseInt(hostelId) } : {};

    // Run queries in parallel for speed
    const [studentCount, staffCount] = await Promise.all([
      Prisma.student.count({ where }),
      Prisma.employee.count({ where }),
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
    const { hostelId } = req.query;
    // If specific hostel, filter by it. If "all", no filter.
    const filter =
      hostelId && hostelId !== "all" ? { hostelId: parseInt(hostelId) } : {};

    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);

    // Merge date filter with hostel filter
    const feeWhere = { ...filter, paymentDate: { gte: startDate } };
    const salaryWhere = { ...filter, paymentDate: { gte: startDate } };
    const expenseWhere = { ...filter, expenseDate: { gte: startDate } };

    // 2. Fetch Data
    const [feeCollections, salaryPayments, expenses] = await Promise.all([
      Prisma.feeCollection.findMany({
        where: feeWhere,
        select: { amount: true, paymentDate: true },
      }),
      Prisma.salaryPayment.findMany({
        where: salaryWhere,
        select: { amount: true, paymentDate: true },
      }),
      Prisma.expense.findMany({
        where: expenseWhere,
        select: { amount: true, expenseDate: true },
      }),
    ]);

    // 3. Aggregate Data by Month
    const getMonthKey = (date) => {
      const d = new Date(date);
      return d.toLocaleString("default", { month: "short", year: "numeric" });
    };

    const monthlyData = {};

    // Initialize all months to 0 to ensure continuity if needed,
    // but for now just aggregating existing data

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

    // 4. Convert Object to Array
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
// 3. THIS MONTH'S RECOVERY
// ==========================
dashboardRouter.get("/stats/current-month-recovery", async (req, res) => {
  try {
    const { hostelId } = req.query;
    const filterHostelId =
      hostelId && hostelId !== "all" ? parseInt(hostelId) : null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 1. Total Collectable
    // If "all", we need to sum up (students * hostel.fee) for EACH hostel
    // If specific, just one hostel.

    let expectedRevenue = 0;

    if (filterHostelId) {
      // Single Hostel
      const hostel = await Prisma.hostel.findUnique({
        where: { id: filterHostelId },
        include: { _count: { select: { students: true } } },
      });
      if (hostel) {
        expectedRevenue = (hostel._count.students || 0) * (hostel.fee || 0);
      }
    } else {
      // All Hostels
      const hostels = await Prisma.hostel.findMany({
        include: { _count: { select: { students: true } } },
      });
      expectedRevenue = hostels.reduce(
        (sum, h) => sum + h._count.students * (h.fee || 0),
        0,
      );
    }

    const collectionWhere = {
      paymentDate: { gte: startOfMonth, lte: endOfMonth },
    };
    const expenseWhere = {
      expenseDate: { gte: startOfMonth, lte: endOfMonth },
    };

    if (filterHostelId) {
      collectionWhere.hostelId = filterHostelId;
      expenseWhere.hostelId = filterHostelId;
    }

    const [collectedThisMonth, salaryThisMonth, expensesThisMonth] =
      await Promise.all([
        Prisma.feeCollection.aggregate({
          where: collectionWhere,
          _sum: { amount: true },
        }),
        Prisma.salaryPayment.aggregate({
          where: collectionWhere,
          _sum: { amount: true },
        }),
        Prisma.expense.aggregate({
          where: expenseWhere,
          _sum: { amount: true },
        }),
      ]);

    const collectedAmount = collectedThisMonth._sum.amount || 0;
    const salaryPaid = salaryThisMonth._sum.amount || 0;
    const generalExpenses = expensesThisMonth._sum.amount || 0;
    const totalExpense = salaryPaid + generalExpenses;

    const pendingAmount = expectedRevenue - collectedAmount;

    res.status(200).json({
      month: now.toLocaleString("default", { month: "long" }),
      expected: expectedRevenue,
      collected: collectedAmount,
      salaryPaid: salaryPaid,
      generalExpenses: generalExpenses,
      totalExpense: totalExpense,
      pending: pendingAmount > 0 ? pendingAmount : 0,
    });
  } catch (error) {
    console.error("Recovery Stats Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 4. HOSTEL LIST & PERFORMANCE
// ==========================

// Get list of all hostels for dropdown
dashboardRouter.get("/hostel-list", async (req, res) => {
  try {
    const hostels = await Prisma.hostel.findMany({
      select: { id: true, hostelName: true, email: true },
    });
    res.status(200).json({ hostels });
  } catch (error) {
    console.error("Hostel List Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get aggregate performance stats for ALL hostels
dashboardRouter.get("/stats/hostel-performance", async (req, res) => {
  try {
    // We want a table: Hostel Name | Email | Total Students | Total Revenue (All Time) | Total Expense (All Time)

    const hostels = await Prisma.hostel.findMany({
      include: {
        _count: { select: { students: true } },
        feeCollections: { select: { amount: true } }, // Revenue
        salaryPayments: { select: { amount: true } }, // Expense 1
        expenses: { select: { amount: true } }, // Expense 2
      },
    });

    const performanceData = hostels.map((h) => {
      const totalRevenue = h.feeCollections.reduce(
        (sum, f) => sum + f.amount,
        0,
      );
      const totalSalary = h.salaryPayments.reduce(
        (sum, s) => sum + s.amount,
        0,
      );
      const totalGeneralExpense = h.expenses.reduce(
        (sum, e) => sum + e.amount,
        0,
      );

      return {
        id: h.id,
        name: h.hostelName,
        email: h.email,
        studentCount: h._count.students,
        totalRevenue,
        totalSalary,
        totalGeneralExpense,
        totalExpense: totalSalary + totalGeneralExpense,
      };
    });

    res.status(200).json({ performance: performanceData });
  } catch (error) {
    console.error("Hostel Performance Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 5. DIRECTORY LISTS (Students & Staff)
// ==========================

// Get All Students (with Hostel Name)
dashboardRouter.get("/details/students", async (req, res) => {
  try {
    const { hostelId } = req.query;
    const where =
      hostelId && hostelId !== "all" ? { hostelId: parseInt(hostelId) } : {};

    const students = await Prisma.student.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        studentMobileNo: true,
        passportPhotoUrl: true,
        hostel: { select: { hostelName: true } }, // Include Hostel Name
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ students });
  } catch (error) {
    console.error("Dashboard Students List Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get All Staff (with Hostel Name)
dashboardRouter.get("/details/staff", async (req, res) => {
  try {
    const { hostelId } = req.query;
    const where =
      hostelId && hostelId !== "all" ? { hostelId: parseInt(hostelId) } : {};

    const staff = await Prisma.employee.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        photoUrl: true,
        hostel: { select: { hostelName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ staff });
  } catch (error) {
    console.error("Dashboard Staff List Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 6. SETTINGS (Fee Setup)
// ==========================
dashboardRouter.put("/update-fee", async (req, res) => {
  try {
    const { fee, hostelId } = req.body;

    // In a real app, we'd use req.user.id or verify permission
    // For now, we trust the body or default to 1 if not provided (though FE provides it)
    const targetHostelId = hostelId ? parseInt(hostelId) : 1;

    const updatedHostel = await Prisma.hostel.update({
      where: { id: targetHostelId },
      data: { fee: parseFloat(fee) },
    });

    res
      .status(200)
      .json({ message: "Fee updated successfully", hostel: updatedHostel });
  } catch (error) {
    console.error("Update Fee Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default dashboardRouter;
