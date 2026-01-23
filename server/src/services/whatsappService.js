import pkg from "whatsapp-web.js";
const { Client, RemoteAuth } = pkg;
import qrcode from "qrcode-terminal";
import Prisma from "../lib/prisma.js";
import DatabaseStore from "../utils/DatabaseStore.js";

const store = new DatabaseStore();
const SESSION_ID = "hostel";

export let whatsappClient = null;

export const initializeWhatsapp = async () => {
  console.log("🔄 Initializing WhatsApp (Ultra-Lite Mode)...");

  whatsappClient = new Client({
    authStrategy: new RemoteAuth({
      clientId: SESSION_ID,
      store: store,
      backupSyncIntervalMs: 600000,
      dataPath: ".wwebjs_auth",
    }),
    // Increase timeouts significantly for slow free servers
    authTimeoutMs: 120000, // 2 Minutes
    qrMaxRetries: 10,
    puppeteer: {
      headless: true,
      executablePath:
        "/opt/render/project/src/.cache/chrome/linux-143.0.7499.192/chrome-linux64/chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-extensions", // ⬇️ SAVES MEMORY
        "--disable-software-rasterizer", // ⬇️ SAVES MEMORY
        "--mute-audio", // ⬇️ SAVES MEMORY
        "--disable-background-networking", // ⬇️ SAVES MEMORY
        "--disable-default-apps", // ⬇️ SAVES MEMORY
        "--disable-sync", // ⬇️ SAVES MEMORY
        "--disable-translate", // ⬇️ SAVES MEMORY
        "--metrics-recording-only", // ⬇️ SAVES MEMORY
      ],
    },
  });

  whatsappClient.on("qr", (qr) => {
    console.log("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄");
    console.log("📲 SCAN QUICKLY! (Server might restart due to low RAM)");
    console.log("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄");
    qrcode.generate(qr, { small: true });
  });

  whatsappClient.on("ready", () => {
    console.log("🚀 WhatsApp Client is Ready!");
  });

  whatsappClient.on("remote_session_saved", () => {
    console.log("💾 Session successfully saved to Database!");
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
