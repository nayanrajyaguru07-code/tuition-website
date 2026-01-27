// src/services/whatsappClient.js
import pkg from "whatsapp-web.js";
const { Client, RemoteAuth } = pkg;
import qrcode from "qrcode-terminal";
import PrismaStore from "../utils/PrismaStore.js";

// Initialize our custom store
const store = new PrismaStore();

const client = new Client({
  authStrategy: new RemoteAuth({
    store: store,
    clientId: "hostel-admin", // Unique ID for this session
    backupSyncIntervalMs: 300000, // Save to DB every 5 minutes
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // Helps prevent crashes on low-memory servers
    ],
  },
});

client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp Client is ready!");
});

// This event fires when the session is successfully saved to DB
client.on("remote_session_saved", () => {
  console.log("Session saved to Database successfully!");
});

client.initialize();

export default client;
