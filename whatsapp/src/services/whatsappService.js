import pkg from "whatsapp-web.js";
const { Client, RemoteAuth } = pkg;

import qrcode from "qrcode-terminal";
import Prisma from "../lib/prisma.js";
import DatabaseStore from "../utils/DatabaseStore.js";

const store = new DatabaseStore();
const SESSION_ID = "hostel";

export let whatsappClient = null;

export const initializeWhatsapp = async () => {
  console.log("🔄 Initializing WhatsApp (HF Safe Mode)...");

  try {
    const existingSession = await Prisma.whatsappSession.findUnique({
      where: { sessionId: SESSION_ID },
    });

    if (existingSession) {
      console.log("✅ Found existing session in DB.");
    } else {
      console.log("ℹ️ No session found. Awaiting QR Code...");
    }
  } catch {}

  whatsappClient = new Client({
    authStrategy: new RemoteAuth({
      clientId: SESSION_ID,
      store: store,
      backupSyncIntervalMs: 600000,
      dataPath: ".wwebjs_auth",
    }),

    authTimeoutMs: 120000,
    qrMaxRetries: 10,

    puppeteer: {
      headless: true,
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--no-zygote",
        "--single-process",
      ],
    },
  });

  whatsappClient.on("qr", (qr) => {
    console.log("📲 Scan this QR Code FAST:");
    qrcode.generate(qr, { small: true });
  });

  whatsappClient.on("ready", () => {
    console.log("🚀 WhatsApp Client is Ready!");
  });

  whatsappClient.on("remote_session_saved", () => {
    console.log("💾 Session saved to Database!");
  });

  whatsappClient.on("disconnected", (reason) => {
    console.log("❌ Client Disconnected:", reason);
  });

  try {
    await whatsappClient.initialize();
  } catch (err) {
    console.error("❌ WhatsApp Init Error:", err.message);
  }
};
