import Prisma from "../lib/prisma.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import extract from "extract-zip";
import axios from "axios";
import { pipeline } from "stream/promises";

class CloudinaryStore {
  constructor() {
    this.prisma = Prisma;
  }

  async sessionExists(options) {
    try {
      const session = await this.prisma.whatsappSession.findUnique({
        where: { sessionId: options.session },
      });
      return !!session;
    } catch (error) {
      return false;
    }
  }

  async save(options) {
    const idToSave = options.session;
    const authDir = path.resolve(process.cwd(), ".wwebjs_auth");

    // 1. Check if folder exists
    const possiblePaths = [
      path.join(authDir, `session-${idToSave}`),
      path.join(authDir, idToSave),
    ];
    const targetDir = possiblePaths.find((p) => fs.existsSync(p));

    if (!targetDir) {
      console.error("⚠️ [SAVE] Session folder not found! (Skipping)");
      return Promise.reject(new Error("Session folder not found"));
    }

    console.log(`✅ [SAVE] Found active session: ${targetDir}`);

    const tempBackupName = `temp_safe_copy_${idToSave}`;
    const tempBackupDir = path.resolve(process.cwd(), tempBackupName);
    const zipName = `backup-${idToSave}.zip`;
    const zipPath = path.resolve(process.cwd(), zipName);

    try {
      console.log("📂 [SAVE] Creating slim snapshot...");
      // FILTER: Ignore Cache & Locks to keep file small & prevent errors
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

      console.log("📦 [SAVE] Zipping snapshot...");
      await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        output.on("close", resolve);
        archive.on("error", reject);
        archive.pipe(output);
        archive.directory(tempBackupDir, false);
        archive.finalize();
      });

      console.log("☁️ [SAVE] Uploading to Cloudinary (Public)...");
      // FORCE PUBLIC: Prevents 401 Unauthorized errors
      const result = await cloudinary.uploader.upload(zipPath, {
        folder: "whatsapp_sessions",
        public_id: `session_${idToSave}`,
        resource_type: "raw",
        access_mode: "public",
        overwrite: true,
      });

      await this.prisma.whatsappSession.upsert({
        where: { sessionId: idToSave },
        update: { data: result.secure_url },
        create: { sessionId: idToSave, data: result.secure_url },
      });
      console.log("✅ [SAVE] Complete!");
    } catch (err) {
      console.error("❌ [SAVE] Failed:", err.message);
    } finally {
      // SAFE CLEANUP: Don't crash if file is missing
      if (await fs.pathExists(tempBackupDir))
        await fs.remove(tempBackupDir).catch(() => {});
      if (await fs.pathExists(zipPath))
        await fs.unlink(zipPath).catch(() => {});
    }
  }

  async extract(options) {
    const idToExtract = options.session;
    console.log(`🔄 [RESTORE] Starting restore for: ${idToExtract}`);

    const authDir = path.resolve(process.cwd(), ".wwebjs_auth");
    const extractPath = path.join(authDir, idToExtract);
    const zipPath = path.resolve(process.cwd(), `restore-${idToExtract}.zip`);

    const session = await this.prisma.whatsappSession.findUnique({
      where: { sessionId: idToExtract },
    });

    if (!session || !session.data) {
      console.log("ℹ️ [RESTORE] No session in DB. Starting fresh.");
      return;
    }

    try {
      console.log(`⬇️ [RESTORE] Downloading...`);

      const response = await axios({
        url: session.data,
        method: "GET",
        responseType: "stream",
        validateStatus: (status) => status < 400,
      });

      await pipeline(response.data, fs.createWriteStream(zipPath));

      // CRASH GUARD: Ensure file exists before unzipping
      if (!fs.existsSync(zipPath)) {
        throw new Error("Download failed: Zip file not found.");
      }

      console.log(`📦 [RESTORE] Extracting...`);
      await fs.ensureDir(authDir);
      await fs.ensureDir(extractPath);
      await extract(zipPath, { dir: extractPath });

      console.log(`✅ [RESTORE] Success!`);
    } catch (err) {
      console.error("❌ [RESTORE] Failed:", err.message);
      // Self-Healing: Delete bad link so we don't loop
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 404)
      ) {
        console.warn("⚠️ [RESTORE] Link is broken. Deleting from DB to reset.");
        await this.prisma.whatsappSession
          .delete({ where: { sessionId: idToExtract } })
          .catch(() => {});
      }
    } finally {
      // SAFE CLEANUP: Check existence before unlink to prevent ENOENT crash
      if (await fs.pathExists(zipPath))
        await fs.unlink(zipPath).catch(() => {});
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

export default CloudinaryStore;
