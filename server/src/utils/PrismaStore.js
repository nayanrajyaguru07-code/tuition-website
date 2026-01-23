import Prisma from "../lib/prisma.js";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import extract from "extract-zip";

class PrismaStore {
  constructor() {
    this.prisma = Prisma;
  }

  async sessionExists(options) {
    const session = await this.prisma.whatsappSession.findUnique({
      where: { sessionId: options.session },
    });
    return !!session;
  }

  // 1. SAVE: Zip the folder -> Convert to Base64 -> Save to DB
  async save(options) {
    const tempDir = path.resolve(
      process.cwd(),
      `RemoteAuth-${options.session}`,
    );
    const zipPath = path.resolve(
      process.cwd(),
      `backup-${options.session}.zip`,
    );

    // Check if directory exists before trying to zip
    if (!fs.existsSync(tempDir)) return;

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip");

      output.on("close", async () => {
        try {
          // Convert Zip to Base64 String
          const fileBuffer = await fs.readFile(zipPath);
          const base64Data = fileBuffer.toString("base64");

          // Upload to Database
          await this.prisma.whatsappSession.upsert({
            where: { sessionId: options.session },
            update: { data: base64Data },
            create: { sessionId: options.session, data: base64Data },
          });

          // Cleanup: Delete the local zip file
          await fs.unlink(zipPath);
          console.log("💾 Session Saved to Database (Zipped)!");
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      archive.on("error", (err) => reject(err));
      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });
  }

  // 2. EXTRACT: Get Base64 from DB -> Convert to Zip -> Unzip folder
  async extract(options) {
    const session = await this.prisma.whatsappSession.findUnique({
      where: { sessionId: options.session },
    });

    if (!session || !session.data) {
      console.log("ℹ️ No session data found in DB.");
      return;
    }

    const zipPath = path.resolve(
      process.cwd(),
      `restore-${options.session}.zip`,
    );
    const extractPath = path.resolve(
      process.cwd(),
      `RemoteAuth-${options.session}`,
    );

    try {
      // Write DB data to a Zip file
      const buffer = Buffer.from(session.data, "base64");
      await fs.writeFile(zipPath, buffer);

      // Unzip it
      await extract(zipPath, { dir: extractPath });

      // Cleanup
      await fs.unlink(zipPath);
      console.log("📂 Session Restored from Database!");
    } catch (err) {
      console.error("❌ Failed to restore session:", err);
    }
  }

  // 3. DELETE: Remove from DB and Disk
  async delete(options) {
    await this.prisma.whatsappSession
      .delete({
        where: { sessionId: options.session },
      })
      .catch(() => {});

    const extractPath = path.resolve(
      process.cwd(),
      `RemoteAuth-${options.session}`,
    );
    await fs.remove(extractPath).catch(() => {});
  }
}

export default PrismaStore;
