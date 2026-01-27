import express from "express";
const salaryRouter = express.Router();
import Prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/authMiddleware.js";

// ==========================
// 1. ADD SALARY (POST)
// ==========================
salaryRouter.post("/pay-salary", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;
    // const hostelId = 1;

    const {
      employeeId,
      amount,
      salaryMonth,
      paymentDate,
      paymentMethod,
      remarks,
    } = req.body;

    if (!employeeId || !amount || !salaryMonth) {
      return res.status(400).json({
        message:
          "Employee ID, Amount, and Salary Month (e.g., 'Jan 2026') are required",
      });
    }

    // 1. Verify Employee belongs to Hostel
    const employee = await Prisma.employee.findFirst({
      where: { id: parseInt(employeeId), hostelId: hostelId },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // 2. Create Payment Record
    const newPayment = await Prisma.salaryPayment.create({
      data: {
        hostelId: hostelId,
        employeeId: parseInt(employeeId),
        amount: parseFloat(amount),
        salaryMonth: salaryMonth,
        paymentMethod: paymentMethod || "Cash",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        remarks: remarks || null,
      },
    });

    res.status(201).json({
      message: "Salary paid successfully",
      payment: newPayment,
    });
  } catch (error) {
    console.error("Pay Salary Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 2. LIST ALL SALARIES (GET)
// ==========================
// Shows a list of all payments made by the hostel
salaryRouter.get("/all-salary-payments", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;
    // const hostelId = 1;

    const payments = await Prisma.salaryPayment.findMany({
      where: { hostelId: hostelId },
      include: {
        employee: {
          select: { name: true, email: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    // Format for cleaner frontend display
    const formattedPayments = payments.map((p) => ({
      id: p.id,
      employeeName: p.employee.name,
      employeeEmail: p.employee.email,
      amount: p.amount,
      salaryMonth: p.salaryMonth,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
    }));

    res.status(200).json({
      count: formattedPayments.length,
      payments: formattedPayments,
    });
  } catch (error) {
    console.error("List Salary Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 3. SINGLE SALARY DETAILS (GET)
// ==========================
salaryRouter.get("/salary-details/:id", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;
    // const hostelId = 1;
    const paymentId = parseInt(req.params.id);

    const payment = await Prisma.salaryPayment.findFirst({
      where: { id: paymentId, hostelId: hostelId },
      include: {
        employee: { select: { name: true, role: true } },
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.status(200).json({ payment });
  } catch (error) {
    console.error("Salary Detail Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 4. ALL SALARY OF ONE EMPLOYEE (GET)
// ==========================
salaryRouter.get(
  "/employee-salary-history/:employeeId",
  authMiddleware,
  async (req, res) => {
    try {
      const hostelId = req.user.id;
      // const hostelId = 1;

      const employeeId = parseInt(req.params.employeeId);

      // Verify Employee
      const employee = await Prisma.employee.findFirst({
        where: { id: employeeId, hostelId: hostelId },
        select: { name: true, salary: true }, // getting base salary for reference
      });

      if (!employee)
        return res.status(404).json({ message: "Employee not found" });

      const history = await Prisma.salaryPayment.findMany({
        where: { employeeId: employeeId, hostelId: hostelId },
        orderBy: { paymentDate: "desc" },
      });

      res.status(200).json({
        employeeName: employee.name,
        baseSalary: employee.salary,
        history,
      });
    } catch (error) {
      console.error("Employee Salary History Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ==========================
// 5. UPDATE SALARY (PUT)
// ==========================
salaryRouter.put("/update-salary/:id", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;
    // const hostelId = 1;

    const paymentId = parseInt(req.params.id);
    const { amount, salaryMonth, paymentDate, paymentMethod, remarks } =
      req.body;

    const existingPayment = await Prisma.salaryPayment.findFirst({
      where: { id: paymentId, hostelId: hostelId },
    });

    if (!existingPayment)
      return res.status(404).json({ message: "Payment not found" });

    const updatedPayment = await Prisma.salaryPayment.update({
      where: { id: paymentId },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        salaryMonth,
        paymentMethod,
        remarks,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      },
    });

    res
      .status(200)
      .json({ message: "Salary updated", payment: updatedPayment });
  } catch (error) {
    console.error("Update Salary Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 6. DELETE SALARY (DELETE)
// ==========================
salaryRouter.delete("/delete-salary/:id", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;
    // const hostelId = 1;

    const paymentId = parseInt(req.params.id);

    const payment = await Prisma.salaryPayment.findFirst({
      where: { id: paymentId, hostelId: hostelId },
    });

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    await Prisma.salaryPayment.delete({ where: { id: paymentId } });

    res.status(200).json({ message: "Salary record deleted successfully" });
  } catch (error) {
    console.error("Delete Salary Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 7. SALARY STATUS (GET) - Total, Paid, Due
// ==========================
// Usage: /salary-status/1?month=Jan 2026
salaryRouter.get(
  "/salary-status/:employeeId",
  authMiddleware,
  async (req, res) => {
    try {
      const hostelId = req.user.id;
      // const hostelId = 1;

      const employeeId = parseInt(req.params.employeeId);
      // Optional: Filter by specific month from query params (e.g., ?month=Jan 2026)
      const { month } = req.query;

      // 1. Get Employee's Base Salary (The "Total" expected)
      const employee = await Prisma.employee.findFirst({
        where: { id: employeeId, hostelId: hostelId },
        select: { id: true, name: true, salary: true },
      });

      if (!employee)
        return res.status(404).json({ message: "Employee not found" });

      // 2. Calculate Total Paid
      // If a month is provided, we filter by it. Otherwise, we might sum ALL history
      // (but 'Due' usually only makes sense per month).
      // Let's assume if no month is given, we return stats for ALL time vs specific month logic.

      let whereClause = {
        employeeId: employeeId,
        hostelId: hostelId,
      };

      if (month) {
        whereClause.salaryMonth = month;
      }

      const paymentStats = await Prisma.salaryPayment.aggregate({
        where: whereClause,
        _sum: { amount: true },
      });

      const totalSalary = employee.salary || 0; // Monthly Fixed Salary
      const paidAmount = paymentStats._sum.amount || 0;

      // Logic:
      // If filtering by month: Due = Fixed Salary - Paid in that month
      // If no month filter: Due calculation is tricky, but let's just show Total vs Paid
      const dueAmount = month ? totalSalary - paidAmount : 0;

      res.status(200).json({
        employee: employee,
        month: month || "All Time",
        status: {
          totalSalary: totalSalary, // The fixed monthly salary
          paid: paidAmount, // How much given so far
          due: dueAmount < 0 ? 0 : dueAmount, // Remaining to pay (prevent negative)
        },
      });
    } catch (error) {
      console.error("Salary Status Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default salaryRouter;
