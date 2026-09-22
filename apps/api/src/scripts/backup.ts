import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR_PATH } from "../services/storageService";
import mongoose from "mongoose";

export async function runDatabaseBackup() {
  console.log("[backup] Starting automated database backup...");
  try {
    const backupDir = path.join(UPLOAD_DIR_PATH, "backups");
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `db-backup-${timestamp}.json`);

    const data: Record<string, any[]> = {};
    const models = mongoose.modelNames();

    for (const modelName of models) {
      const model = mongoose.model(modelName);
      data[modelName] = await model.find({}).lean();
    }

    await fs.writeFile(backupFile, JSON.stringify(data, null, 2), "utf8");
    console.log(`[backup] Successfully created backup at ${backupFile}`);

    // Optional: Keep only the last 7 backups to save disk space
    const files = await fs.readdir(backupDir);
    const backups = files.filter(f => f.startsWith("db-backup-")).sort();
    if (backups.length > 7) {
      const toDelete = backups.slice(0, backups.length - 7);
      for (const file of toDelete) {
        await fs.unlink(path.join(backupDir, file));
        console.log(`[backup] Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    console.error("[backup] Failed to run database backup:", error);
  }
}
