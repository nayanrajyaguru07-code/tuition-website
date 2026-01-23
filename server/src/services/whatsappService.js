import pkg from "whatsapp-web.js";
const { Client, RemoteAuth } = pkg;
import qrcode from "qrcode-terminal";
import Prisma from "../lib/prisma.js";
import DatabaseStore from "../utils/DatabaseStore.js";

const store = new DatabaseStore();
const SESSION_ID = "hostel";

export let whatsappClient = null;

export const initializeWhatsapp = async () => {
  console.log("🔄 Initializing WhatsApp (Render Optimized)...");

  try {
    const existingSession = await Prisma.whatsappSession.findUnique({
      where: { sessionId: SESSION_ID },
    });
    if (existingSession && existingSession.data) {
      console.log("✅ Found session in DB. Restoring...");
    } else {
      console.log("ℹ️ No session in DB. Preparing QR Code...");
    }
  } catch (err) {}

  whatsappClient = new Client({
    authStrategy: new RemoteAuth({
      clientId: SESSION_ID,
      store: store,
      backupSyncIntervalMs: 600000,
      dataPath: ".wwebjs_auth",
    }),
    // ⚠️ CRITICAL: Increase timeout for slow Render servers
    authTimeoutMs: 60000,
    qrMaxRetries: 5,
    puppeteer: {
      headless: true,
      // ⚠️ CRITICAL: Point to the installed Chrome manually to be safe
      executablePath:
        "/opt/render/project/src/.cache/chrome/linux-143.0.7499.192/chrome-linux64/chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Fixes crashes in Docker/Render
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // ⚠️ Vital for low RAM (512MB)
        "--disable-gpu",
      ],
    },
  });

  whatsappClient.on("qr", (qr) => {
    // Print QR code to logs so you can scan it from Render Dashboard
    console.log("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄");
    console.log("📲 SCAN THIS QR CODE NOW:");
    qrcode.generate(qr, { small: true });
    console.log("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄");
  });

  whatsappClient.on("ready", () => {
    console.log("🚀 WhatsApp Client is Ready!");
  });

  whatsappClient.on("remote_session_saved", () => {
    console.log("💾 Session successfully saved to Database!");
  });

  // Log disconnection reasons to debug future crashes
  whatsappClient.on("disconnected", (reason) => {
    console.log("❌ Client Disconnected:", reason);
  });

  try {
    await whatsappClient.initialize();
  } catch (err) {
    console.error("❌ WhatsApp Init Error:", err.message);
  }
};
