import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg; // Switch to LocalAuth
import qrcode from "qrcode-terminal";

// Global client instance
export let whatsappClient;

export const initializeWhatsapp = async () => {
  console.log("🔄 Initializing WhatsApp...");

  // SETUP: Create Client with LocalAuth
  // This automatically saves your session to the '.wwebjs_auth' folder
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      clientId: "hostel-admin", // This creates a folder named 'client-hostel-admin'
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  });

  // LISTEN: Handle Events

  // EVENT: QR Code (Fires only if you are NOT logged in)
  whatsappClient.on("qr", (qr) => {
    console.log("⚠️ No saved session found. Please scan this QR:");
    qrcode.generate(qr, { small: true });
  });

  // EVENT: Ready (Connection Successful)
  whatsappClient.on("ready", () => {
    console.log("🚀 WhatsApp Client is Ready!");
  });

  // EVENT: Auth Failure
  whatsappClient.on("auth_failure", (msg) => {
    console.error("❌ Authentication Failed:", msg);
    // If auth fails, the folder might be corrupted.
    // You would manually delete '.wwebjs_auth' folder to reset.
  });

  // START
  try {
    await whatsappClient.initialize();
  } catch (err) {
    console.error("Initialization Error:", err);
  }
};
