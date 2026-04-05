import express from "express";
const dashboardRouter = express.Router();
import Prisma from "../lib/prisma.js";

// ==========================
// 1. DASHBOARD COUNTS (Cards)
// ==========================
dashboardRouter.get("/stats/counts", async (req, res) => {
  try {
    const { hostelId } = req.query;
    const where = {};

    if (hostelId && hostelId !== "all") {
      where.hostelId = parseInt(hostelId);
    }

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
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);

    const where = {};
    if (hostelId && hostelId !== "all") {
      where.hostelId = parseInt(hostelId);
    }

    const [feeCollections, salaryPayments, expenses] = await Promise.all([
      Prisma.feeCollection.findMany({
        where: {
          ...where,
          paymentDate: { gte: startDate },
        },
        select: { amount: true, paymentDate: true },
      }),
      Prisma.salaryPayment.findMany({
        where: {
          ...where,
          paymentDate: { gte: startDate },
        },
        select: { amount: true, paymentDate: true },
      }),
      Prisma.expense.findMany({
        where: {
          ...where,
          expenseDate: { gte: startDate },
        },
        select: { amount: true, expenseDate: true },
      }),
    ]);

    const getMonthKey = (date) => {
      const d = new Date(date);
      return d.toLocaleString("default", { month: "short", year: "numeric" });
    };

    const monthlyData = {};

    feeCollections.forEach((record) => {
      const key = getMonthKey(record.paymentDate);
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      monthlyData[key].income += record.amount;
    });

    salaryPayments.forEach((record) => {
      const key = getMonthKey(record.paymentDate);
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      monthlyData[key].expense += record.amount;
    });

    expenses.forEach((record) => {
      const key = getMonthKey(record.expenseDate);
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      monthlyData[key].expense += record.amount;
    });

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
    const { hostelId } = req.query;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let expectedRevenue = 0;

    // Calculate Expected Revenue
    if (hostelId && hostelId !== "all") {
      const hId = parseInt(hostelId);
      const hostel = await Prisma.hostel.findUnique({
        where: { id: hId },
        include: { _count: { select: { students: true } } },
      });
      if (hostel) {
        expectedRevenue = (hostel._count.students || 0) * (hostel.fee || 0);
      }
    } else {
      // Aggregate for ALL hostels
      const hostels = await Prisma.hostel.findMany({
        include: { _count: { select: { students: true } } },
      });
      expectedRevenue = hostels.reduce(
        (sum, h) => sum + (h._count.students || 0) * (h.fee || 0),
        0,
      );
    }

    // 2. Calculate Collected
    const commonWhere = {
      paymentDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };
    if (hostelId && hostelId !== "all") {
      commonWhere.hostelId = parseInt(hostelId);
    }

    const collectedThisMonth = await Prisma.feeCollection.aggregate({
      where: commonWhere,
      _sum: { amount: true },
    });

    // 3. Calculate Salary Paid
    const salaryPaidThisMonth = await Prisma.salaryPayment.aggregate({
      where: commonWhere,
      _sum: { amount: true },
    });

    // 4. Calculate General Expenses
    const expenseWhere = {
      expenseDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };
    if (hostelId && hostelId !== "all") {
      expenseWhere.hostelId = parseInt(hostelId);
    }

    const generalExpensesThisMonth = await Prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
    });

    const collectedAmount = collectedThisMonth._sum.amount || 0;
    const salaryPaidAmount = salaryPaidThisMonth._sum.amount || 0;
    const generalExpensesAmount = generalExpensesThisMonth._sum.amount || 0;
    const totalExpenseAmount = salaryPaidAmount + generalExpensesAmount;

    const pendingAmount = expectedRevenue - collectedAmount;

    res.status(200).json({
      month: now.toLocaleString("default", { month: "long" }),
      expected: expectedRevenue,
      collected: collectedAmount,
      pending: pendingAmount > 0 ? pendingAmount : 0,
      salaryPaid: salaryPaidAmount,
      generalExpenses: generalExpensesAmount,
      totalExpense: totalExpenseAmount,
    });
  } catch (error) {
    console.error("Recovery Stats Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 4. STUDENT & STAFF DETAILS
// ==========================
dashboardRouter.get("/details/students", async (req, res) => {
  try {
    const { hostelId } = req.query;
    const where = {};
    if (hostelId && hostelId !== "all") {
      where.hostelId = parseInt(hostelId);
    }

    const students = await Prisma.student.findMany({
      where,
      include: {
        hostel: {
          select: { hostelName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ students });
  } catch (error) {
    console.error("Dashboard Student Details Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

dashboardRouter.get("/details/staff", async (req, res) => {
  try {
    const { hostelId } = req.query;
    const where = {};
    if (hostelId && hostelId !== "all") {
      where.hostelId = parseInt(hostelId);
    }

    const staff = await Prisma.employee.findMany({
      where,
      orderBy: { dateOfJoining: "desc" },
    });

    res.status(200).json({ staff });
  } catch (error) {
    console.error("Dashboard Staff Details Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 5. HOSTEL PERFORMANCE (For Admin "All Hostels" View)
// ==========================
dashboardRouter.get("/stats/hostel-performance", async (req, res) => {
  try {
    const hostels = await Prisma.hostel.findMany({
      select: {
        id: true,
        hostelName: true,
      },
    });

    const performance = await Promise.all(
      hostels.map(async (hostel) => {
        const [feeRes, salaryRes, expenseRes] = await Promise.all([
          Prisma.feeCollection.aggregate({
            where: { hostelId: hostel.id },
            _sum: { amount: true },
          }),
          Prisma.salaryPayment.aggregate({
            where: { hostelId: hostel.id },
            _sum: { amount: true },
          }),
          Prisma.expense.aggregate({
            where: { hostelId: hostel.id },
            _sum: { amount: true },
          }),
        ]);

        const totalRevenue = feeRes._sum.amount || 0;
        const totalExpense =
          (salaryRes._sum.amount || 0) + (expenseRes._sum.amount || 0);

        return {
          id: hostel.id,
          name: hostel.hostelName,
          totalRevenue,
          totalExpense,
        };
      }),
    );

    res.status(200).json({ performance });
  } catch (error) {
    console.error("Hostel Performance Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 6. HOSTEL LIST (For Dropdown)
// ==========================
dashboardRouter.get("/hostel-list", async (req, res) => {
  try {
    const hostels = await Prisma.hostel.findMany({
      select: {
        id: true,
        hostelName: true,
      },
    });
    res.status(200).json({ hostels });
  } catch (error) {
    console.error("Hostel List Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default dashboardRouter;
