import Prisma from "../lib/prisma.js";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import extract from "extract-zip";

class DatabaseStore {
  constructor() {
    this.prisma = Prisma;
  }

  async sessionExists(options) {
    try {
      const session = await this.prisma.whatsappSession.findUnique({
        where: { sessionId: options.session },
      });
      return !!(session && session.data);
    } catch (error) {
      return false;
    }
  }

  async save(options) {
    const idToSave = options.session;
    const authDir = path.resolve(process.cwd(), ".wwebjs_auth");

    const possiblePaths = [
      path.join(authDir, `session-${idToSave}`),
      path.join(authDir, idToSave),
    ];
    const targetDir = possiblePaths.find((p) => fs.existsSync(p));

    if (!targetDir) {
      console.error("⚠️ [DB-STORE] Session folder not found! (Skipping)");
      return Promise.reject(new Error("Session folder not found"));
    }

    console.log(`✅ [DB-STORE] Found active session: ${targetDir}`);

    const tempBackupName = `temp_db_copy_${idToSave}`;
    const tempBackupDir = path.resolve(process.cwd(), tempBackupName);
    // Standardize filename: RemoteAuth-hostel.zip
    const zipName = `${idToSave}.zip`;
    const zipPath = path.resolve(process.cwd(), zipName);

    try {
      console.log("📂 [DB-STORE] Creating slim snapshot...");
      await fs.copy(targetDir, tempBackupDir, {
        dereference: true,
        filter: (src) => {
          const cleanSrc = src.replace(/\\/g, "/");
          if (cleanSrc.includes("/Cache")) return false;
          if (cleanSrc.includes("/Code Cache")) return false;
          if (cleanSrc.includes("/GPUCache")) return false;
          if (cleanSrc.includes("/Crashpad")) return false;
          if (cleanSrc.includes("LOCK")) return false;
          if (cleanSrc.includes("/Default/Sessions")) return false;
          if (cleanSrc.includes("/Default/Network")) return false;
          if (cleanSrc.includes("Safe Browsing")) return false;
          if (cleanSrc.includes("/Default/IndexedDB")) return false;
          if (cleanSrc.includes("/Default/Service Worker")) return false;
          return true;
        },
      });

      console.log("📦 [DB-STORE] Zipping...");
      await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        output.on("close", resolve);
        archive.on("error", reject);
        archive.pipe(output);
        archive.directory(tempBackupDir, false);
        archive.finalize();
      });

      console.log("🔄 [DB-STORE] Converting to Base64...");
      const zipBuffer = await fs.readFile(zipPath);
      const base64Data = zipBuffer.toString("base64");

      console.log(`💾 [DB-STORE] Saving ${base64Data.length} chars to DB...`);
      await this.prisma.whatsappSession.upsert({
        where: { sessionId: idToSave },
        update: { data: base64Data },
        create: { sessionId: idToSave, data: base64Data },
      });

      console.log("✅ [DB-STORE] Saved successfully to Database!");
    } catch (err) {
      console.error("❌ [DB-STORE] Save Failed:", err.message);
    } finally {
      if (fs.existsSync(tempBackupDir))
        await fs.remove(tempBackupDir).catch(() => {});
      // Do NOT delete zipPath here. The library might need it.
    }
  }

  async extract(options) {
    const idToExtract = options.session;
    console.log(`🔄 [DB-STORE] Starting restore for: ${idToExtract}`);

    const authDir = path.resolve(process.cwd(), ".wwebjs_auth");
    const extractPath = path.join(authDir, idToExtract);

    // FIX: Use exact filename matching the 'save' method and error log
    const zipPath = path.resolve(process.cwd(), `${idToExtract}.zip`);

    try {
      const session = await this.prisma.whatsappSession.findUnique({
        where: { sessionId: idToExtract },
      });

      if (!session || !session.data) {
        console.log("ℹ️ [DB-STORE] No session data in DB. Starting fresh.");
        return;
      }

      console.log(`⬇️ [DB-STORE] Fetching Base64 Data...`);
      const zipBuffer = Buffer.from(session.data, "base64");
      await fs.writeFile(zipPath, zipBuffer);

      console.log(`📦 [DB-STORE] Extracting...`);
      await fs.ensureDir(authDir);
      await fs.ensureDir(extractPath);
      await extract(zipPath, { dir: extractPath });

      console.log(`✅ [DB-STORE] Restore Success!`);
    } catch (err) {
      console.error("❌ [DB-STORE] Restore Failed:", err.message);
      await this.prisma.whatsappSession
        .delete({ where: { sessionId: idToExtract } })
        .catch(() => {});
    } finally {
      // CRITICAL FIX: Do NOT delete the zip file yet.
      // The 'RemoteAuth' strategy often tries to read/verify this file immediately after extraction.
      // Leaving it here causes no harm (it just overwrites next time).
    }
  }

  async delete(options) {
    await this.prisma.whatsappSession
      .delete({
        where: { sessionId: options.session },
      })
      .catch(() => {});

    const authDir = path.resolve(process.cwd(), ".wwebjs_auth");
    const targetDir = path.join(authDir, options.session);
    if (fs.existsSync(targetDir)) await fs.remove(targetDir);
  }
}

export default DatabaseStore;
