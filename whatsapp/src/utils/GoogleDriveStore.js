import Prisma from "../lib/prisma.js";
import { google } from "googleapis";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import extract from "extract-zip";
import { pipeline } from "stream/promises";
import dotenv from "dotenv";
dotenv.config();

// 🔴 PASTE YOUR FOLDER ID HERE
const GOOGLE_DRIVE_FOLDER_ID = "16nE09LLN31Boj0kAD_bXgQvBoevGbbhL";
console.log("📂 [DEBUG] Target Folder ID:", GOOGLE_DRIVE_FOLDER_ID);

class GoogleDriveStore {
  constructor() {
    this.prisma = Prisma;

    const keyFilePath = path.resolve(process.cwd(), "service-account.json");

    if (!fs.existsSync(keyFilePath)) {
      throw new Error("❌ MISSING 'service-account.json' file in root folder!");
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    this.drive = google.drive({ version: "v3", auth });
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

    const possiblePaths = [
      path.join(authDir, `session-${idToSave}`),
      path.join(authDir, idToSave),
    ];
    const targetDir = possiblePaths.find((p) => fs.existsSync(p));

    if (!targetDir) {
      console.error("⚠️ [DRIVE] Session folder not found! (Skipping save)");
      return Promise.reject(new Error("Session folder not found"));
    }

    console.log(`✅ [DRIVE] Found active session: ${targetDir}`);
    console.log("📂 [DEBUG] Target Folder ID:", GOOGLE_DRIVE_FOLDER_ID);

    const tempBackupName = `temp_drive_copy_${idToSave}`;
    const tempBackupDir = path.resolve(process.cwd(), tempBackupName);
    const zipName = `backup-${idToSave}.zip`;
    const zipPath = path.resolve(process.cwd(), zipName);

    try {
      console.log("📂 [DRIVE] Creating safe snapshot...");
      console.log("📂 [DEBUG] Target Folder ID:", GOOGLE_DRIVE_FOLDER_ID);

      await fs.copy(targetDir, tempBackupDir, {
        dereference: true,
        filter: (src) => {
          const cleanSrc = src.replace(/\\/g, "/");
          // Filter Heavy/Locked files
          if (cleanSrc.includes("/Cache")) return false;
          if (cleanSrc.includes("/Code Cache")) return false;
          if (cleanSrc.includes("/GPUCache")) return false;
          if (cleanSrc.includes("/Crashpad")) return false;
          if (cleanSrc.includes("LOCK")) return false;
          if (cleanSrc.includes("/Default/Sessions")) return false;
          if (cleanSrc.includes("/Default/Network")) return false;
          if (cleanSrc.includes("Safe Browsing")) return false;
          return true;
        },
      });

      console.log("📦 [DRIVE] Zipping snapshot...");
      await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        output.on("close", resolve);
        archive.on("error", reject);
        archive.pipe(output);
        archive.directory(tempBackupDir, false);
        archive.finalize();
      });

      console.log("☁️ [DRIVE] Searching for existing backup...");
      const fileName = `whatsapp_session_${idToSave}.zip`;

      // Search INSIDE your shared folder
      const search = await this.drive.files.list({
        q: `name = '${fileName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
        fields: "files(id, name)",
      });

      let fileId;
      const media = {
        mimeType: "application/zip",
        body: fs.createReadStream(zipPath),
      };

      if (search.data.files.length > 0) {
        fileId = search.data.files[0].id;
        console.log(`🔄 [DRIVE] Overwriting existing file (ID: ${fileId})...`);
        await this.drive.files.update({
          fileId: fileId,
          media: media,
        });
      } else {
        console.log(`🆕 [DRIVE] Uploading new file to Shared Folder...`);
        const file = await this.drive.files.create({
          requestBody: {
            name: fileName,
            parents: [GOOGLE_DRIVE_FOLDER_ID], // <--- UPLOADS TO YOUR STORAGE
          },
          media: media,
          fields: "id",
        });
        fileId = file.data.id;
      }

      console.log(`🆔 [DRIVE] File ID: ${fileId}`);

      await this.prisma.whatsappSession.upsert({
        where: { sessionId: idToSave },
        update: { data: fileId },
        create: { sessionId: idToSave, data: fileId },
      });

      console.log("✅ [DRIVE] Session Saved to Google Drive & DB!");
    } catch (err) {
      console.error("❌ [DRIVE] Save Failed:", err.message);
    } finally {
      if (fs.existsSync(tempBackupDir))
        await fs.remove(tempBackupDir).catch(() => {});
      if (fs.existsSync(zipPath)) await fs.unlink(zipPath).catch(() => {});
    }
  }

  async extract(options) {
    const idToExtract = options.session;
    console.log(`🔄 [DRIVE] Starting restore for: ${idToExtract}`);

    const authDir = path.resolve(process.cwd(), ".wwebjs_auth");
    const extractPath = path.join(authDir, idToExtract);
    const zipPath = path.resolve(process.cwd(), `restore-${idToExtract}.zip`);

    const session = await this.prisma.whatsappSession.findUnique({
      where: { sessionId: idToExtract },
    });

    if (!session || !session.data) {
      console.log("ℹ️ [DRIVE] No session ID in DB. Starting fresh.");
      return;
    }

    const fileId = session.data;
    console.log(`🆔 [DRIVE] Downloading File ID: ${fileId}`);

    try {
      const response = await this.drive.files.get(
        { fileId: fileId, alt: "media" },
        { responseType: "stream" },
      );

      await pipeline(response.data, fs.createWriteStream(zipPath));

      console.log(`📦 [DRIVE] Extracting...`);
      await fs.ensureDir(authDir);
      await fs.ensureDir(extractPath);
      await extract(zipPath, { dir: extractPath });

      console.log(`✅ [DRIVE] Restore Success!`);
    } catch (err) {
      console.error("❌ [DRIVE] Restore Failed:", err.message);
      if (err.code === 404) {
        console.warn("⚠️ [DRIVE] File not found. Deleting from DB.");
        await this.prisma.whatsappSession
          .delete({ where: { sessionId: idToExtract } })
          .catch(() => {});
      }
    } finally {
      if (fs.existsSync(zipPath)) await fs.unlink(zipPath).catch(() => {});
    }
  }

  async delete(options) {
    const session = await this.prisma.whatsappSession.findUnique({
      where: { sessionId: options.session },
    });

    await this.prisma.whatsappSession
      .delete({
        where: { sessionId: options.session },
      })
      .catch(() => {});

    if (session && session.data) {
      try {
        await this.drive.files.delete({ fileId: session.data });
        console.log("🗑️ [DRIVE] File deleted from cloud.");
      } catch (e) {}
    }

    const authDir = path.resolve(process.cwd(), ".wwebjs_auth");
    const targetDir = path.join(authDir, options.session);
    if (fs.existsSync(targetDir)) await fs.remove(targetDir);
  }
}

export default GoogleDriveStore;
