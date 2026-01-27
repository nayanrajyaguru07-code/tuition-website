// src/services/whatsappSender.js
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import { whatsappClient } from "./whatsappService.js";

export const sendBulkWhatsApp = async (
  { text, mediaUrl, mediaPath },
  numbers,
) => {
  if (!whatsappClient || !whatsappClient.info) {
    return { success: false, message: "Client not ready." };
  }

  const report = [];
  let mediaObj = undefined;

  // 1. Load Media
  try {
    if (mediaUrl)
      mediaObj = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true });
    else if (mediaPath) mediaObj = MessageMedia.fromFilePath(mediaPath);
  } catch (err) {
    return { success: false, message: "Media load failed" };
  }

  console.log(`🚀 Sending to ${numbers.length} contacts...`);

  for (const number of numbers) {
    // 1. Format Number
    let cleanNumber = number.toString().replace(/\D/g, "");
    if (cleanNumber.length === 10) cleanNumber = "91" + cleanNumber;

    let status = "Failed";

    try {
      const chatId = `${cleanNumber}@c.us`;

      // --- BYPASS FIX ---
      // Instead of using client.sendMessage (which crashes), we check registration
      // and then send.
      const isRegistered = await whatsappClient.isRegisteredUser(chatId);

      if (isRegistered) {
        if (mediaObj) {
          // Standard Send (Try this first after checking registration)
          await whatsappClient.sendMessage(chatId, mediaObj, {
            caption: text || "",
          });
        } else {
          await whatsappClient.sendMessage(chatId, text);
        }
        status = "Sent";
        console.log(`✅ Sent to ${cleanNumber}`);
      } else {
        status = "Failed (Not on WhatsApp)";
        console.log(`❌ Number not found: ${cleanNumber}`);
      }
    } catch (error) {
      console.error(`⚠️ Error sending to ${cleanNumber}:`, error.message);
      status = `Error: ${error.message}`;
    }

    report.push({ number: cleanNumber, status });

    // 2-Second Delay (Important for stability)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return { success: true, report };
};
