import pkg from "whatsapp-web.js";
const { Client, RemoteAuth } = pkg; // ✅ Back to RemoteAuth for Render
import qrcode from "qrcode-terminal";
import Prisma from "../lib/prisma.js";

// ✅ Import the DatabaseStore we created
import DatabaseStore from "../utils/DatabaseStore.js";

const store = new DatabaseStore();
const SESSION_ID = "hostel";

export let whatsappClient = null;

export const initializeWhatsapp = async () => {
  console.log("🔄 Initializing WhatsApp (RemoteAuth for Render)...");

  // Optional: Check DB logs to see if data exists
  try {
    const existingSession = await Prisma.whatsappSession.findUnique({
      where: { sessionId: SESSION_ID },
    });
    if (existingSession && existingSession.data) {
      console.log("✅ Found session data in Database. Restoring...");
    } else {
      console.log("ℹ️ No session in Database. You will need to scan QR.");
    }
  } catch (err) {}

  whatsappClient = new Client({
    authStrategy: new RemoteAuth({
      clientId: SESSION_ID,
      store: store,
      backupSyncIntervalMs: 600000, // Backup every 10 minutes
      dataPath: ".wwebjs_auth", // Temp folder (Render will delete this on restart, which is fine)
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Critical for Render (prevents memory crashes)
        "--disable-gpu",
        "--disable-extensions",
      ],
    },
  });

  whatsappClient.on("qr", (qr) => {
    console.log("📲 Scan this QR Code to login:");
    qrcode.generate(qr, { small: true });
  });

  whatsappClient.on("ready", () => {
    console.log("🚀 WhatsApp Client is Ready!");
  });

  whatsappClient.on("remote_session_saved", () => {
    console.log("💾 Session successfully saved to Database!");
  });

  whatsappClient.on("auth_failure", async (msg) => {
    console.error("❌ Authentication Failed:", msg);
  });

  try {
    await whatsappClient.initialize();
  } catch (err) {
    console.error("❌ WhatsApp Init Error:", err.message);
  }
};
