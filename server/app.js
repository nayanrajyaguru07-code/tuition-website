import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import wakeNeon from "./src/connection/DB.wakeNeon.js";
import authRouter from "./src/routes/auth.js";
import userRouter from "./src/routes/user.js";
import studentRouter from "./src/routes/student.js";
import feeCollectionRouter from "./src/routes/feeCollection.js";
import employeeRouter from "./src/routes/employee.js";
import expenseRouter from "./src/routes/expense.js";
import salaryRouter from "./src/routes/salary.js";
import dashboardRouter from "./src/routes/dashboard.js";
import { initializeWhatsapp } from "./src/services/whatsappService.js";
import whatsappRouter from "./src/routes/whatsapp.js";

const app = express();

(async () => {
  await wakeNeon(); // ⬅️ CRITICAL
  initializeWhatsapp();
})();

// Middleware
// ✅ CORS (still needed for APIs)
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running 🚀" });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/student", studentRouter);
app.use("/api/fee-collection", feeCollectionRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/salary", salaryRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/whatsapp", whatsappRouter);

export default app;
