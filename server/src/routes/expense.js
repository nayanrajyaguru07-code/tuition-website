import express from "express";
// Correct router initialization
const expenseRouter = express.Router();
import Prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/authMiddleware.js";

// ==========================
// 1. ADD EXPENSE (POST)
// ==========================
expenseRouter.post("/add-expense", authMiddleware, async (req, res) => {
  try {
    // const hostelId = req.user.id;
    const hostelId = 1;

    const { title, amount, expenseDate, category, paymentMethod, description } =
      req.body;

    // 1. Validation
    if (!title || !amount) {
      return res.status(400).json({ message: "Title and Amount are required" });
    }

    // 2. Create Expense
    const newExpense = await Prisma.expense.create({
      data: {
        hostelId: hostelId,
        title,
        amount: parseFloat(amount),
        // Default to 'now' if date not provided
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        category: category || "General",
        paymentMethod: paymentMethod || "Cash",
        description: description || null,
      },
    });

    res.status(201).json({
      message: "Expense added successfully",
      expense: newExpense,
    });
  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 2. LIST EXPENSES (GET)
// ==========================
// Returns a lightweight list for the dashboard/table
expenseRouter.get("/all-expenses", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;
    // const hostelId = 1;

    const expenses = await Prisma.expense.findMany({
      where: { hostelId: hostelId },
      select: {
        id: true,
        title: true,
        amount: true,
        expenseDate: true,
        category: true, // Useful for sorting/filtering on frontend
      },
      orderBy: {
        expenseDate: "desc", // Newest expenses first
      },
    });

    res.status(200).json({
      count: expenses.length,
      expenses: expenses,
    });
  } catch (error) {
    console.error("Get Expenses List Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 3. EXPENSE DETAILS (GET)
// ==========================
// Returns full details for a single expense
expenseRouter.get("/expense-details/:id", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;
    // const hostelId = 1;

    const expenseId = parseInt(req.params.id);

    if (isNaN(expenseId)) {
      return res.status(400).json({ message: "Invalid Expense ID" });
    }

    const expense = await Prisma.expense.findFirst({
      where: {
        id: expenseId,
        hostelId: hostelId,
      },
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ expense });
  } catch (error) {
    console.error("Get Expense Details Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 4. UPDATE EXPENSE (PUT)
// ==========================
expenseRouter.put("/update-expense/:id", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;
    // const hostelId = 1;

    const expenseId = parseInt(req.params.id);
    const { title, amount, expenseDate, category, paymentMethod, description } =
      req.body;

    // 1. Verify Existence & Ownership
    const existingExpense = await Prisma.expense.findFirst({
      where: { id: expenseId, hostelId: hostelId },
    });

    if (!existingExpense) {
      return res
        .status(404)
        .json({ message: "Expense not found or access denied" });
    }

    // 2. Prepare Update Data
    const updateData = {};
    if (title) updateData.title = title;
    if (amount) updateData.amount = parseFloat(amount);
    if (expenseDate) updateData.expenseDate = new Date(expenseDate);
    if (category) updateData.category = category;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (description !== undefined) updateData.description = description;

    // 3. Update DB
    const updatedExpense = await Prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
    });

    res.status(200).json({
      message: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("Update Expense Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================
// 5. DELETE EXPENSE (DELETE)
// ==========================
expenseRouter.delete(
  "/delete-expense/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const hostelId = req.user.id;
      // const hostelId = 1;

      const expenseId = parseInt(req.params.id);

      // 1. Verify Existence & Ownership
      const existingExpense = await Prisma.expense.findFirst({
        where: { id: expenseId, hostelId: hostelId },
      });

      if (!existingExpense) {
        return res
          .status(404)
          .json({ message: "Expense not found or access denied" });
      }

      // 2. Delete
      await Prisma.expense.delete({
        where: { id: expenseId },
      });

      res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
      console.error("Delete Expense Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default expenseRouter;
