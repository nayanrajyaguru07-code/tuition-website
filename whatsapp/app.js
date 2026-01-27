import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import wakeNeon from "./src/connection/DB.wakeNeon.js";
import whatsappRouter from "./src/routes/whatsapp.js";
import { initializeWhatsapp } from "./src/services/whatsappService.js";

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

app.use("/api/whatsapp", whatsappRouter);

export default app;
