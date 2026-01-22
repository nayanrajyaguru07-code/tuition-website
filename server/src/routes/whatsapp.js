import express from "express";
import multer from "multer";
import fs from "fs";
import { uploadImage } from "../utils/uploadImage.js"; // Your existing Cloudinary helper
import { sendBulkWhatsApp } from "../services/whatsappSender.js"; // Your existing Sender logic

const whatsappRouter = express.Router();

// Setup Multer for handling Form Data (Temp storage)
const upload = multer({ dest: "uploads/" });

// ==========================
// SEND BULK MESSAGE (With File Upload)
// ==========================
whatsappRouter.post(
  "/send-message",
  upload.single("file"),
  async (req, res) => {
    try {
      const { message, numbers } = req.body;
      // 'numbers' will come as a JSON string in FormData (e.g. "[\"9198...\", \"9188...\"]")

      // 1. Parse Numbers
      let targetNumbers = [];
      try {
        if (numbers) {
          targetNumbers = JSON.parse(numbers);
        }
      } catch (e) {
        return res
          .status(400)
          .json({ message: "Invalid numbers format. Send as JSON array." });
      }

      if (!targetNumbers || targetNumbers.length === 0) {
        return res.status(400).json({ message: "No numbers provided." });
      }

      // 2. Handle File Upload (Cloudinary)
      let mediaUrl = null;

      if (req.file) {
        try {
          console.log("📤 Uploading file to Cloudinary...");
          mediaUrl = await uploadImage(req.file.path);

          // Cleanup: Delete local temp file
          fs.unlink(req.file.path, () => {});
        } catch (error) {
          console.error("Cloudinary Upload Error:", error);
          return res
            .status(500)
            .json({ message: "Failed to upload file to server." });
        }
      }

      // 3. Validation: Must have either Text OR Media
      if (!message && !mediaUrl) {
        return res
          .status(400)
          .json({ message: "Please provide a message or a file." });
      }

      // 4. Send via WhatsApp Service
      const result = await sendBulkWhatsApp(
        {
          text: message,
          mediaUrl: mediaUrl,
        },
        targetNumbers,
      );

      if (!result.success) {
        return res.status(503).json(result); // Client not ready
      }

      res.status(200).json({
        message: "Bulk sending completed",
        totalSent: result.total,
        report: result.report,
      });
    } catch (error) {
      console.error("Route Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default whatsappRouter;
