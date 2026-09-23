import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../config/env";

export interface StoredFile {
  url: string;
  key: string;
}

export interface StorageAdapter {
  /** Persists a buffer and returns a URL the frontend can render/link to. */
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile>;
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export function assertUploadIsAllowed(mimeType: string, size: number) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("Only JPEG, PNG, WEBP or PDF files are accepted.");
  }
  if (size > MAX_BYTES) {
    throw new Error("File is too large (max 8MB).");
  }
}

/**
 * Local-disk adapter for development only. Files land in
 * apps/api/uploads/ and are served back over /uploads/*. This is
 * NOT suitable for production — the disk is ephemeral on most
 * hosts, there's no CDN, and there's no per-file access control.
 *
 * PRODUCTION TODO (Phase 4): implement CloudinaryStorageAdapter or
 * S3StorageAdapter against this same StorageAdapter interface,
 * using CLOUDINARY_* / S3 env vars already declared in
 * .env.example, and swap the export below. Rider NID photos and
 * prescriptions are sensitive documents — production storage MUST
 * use signed, expiring URLs rather than public objects.
 */
class LocalDiskStorageAdapter implements StorageAdapter {
  constructor() {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  async save(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile> {
    assertUploadIsAllowed(mimeType, buffer.length);
    const ext = path.extname(originalName) || (mimeType === "application/pdf" ? ".pdf" : ".jpg");
    const key = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, key), buffer);
    return { key, url: `${env.API_BASE_URL.replace(/\/$/, "")}/uploads/${key}` };
  }
}

export const storageAdapter: StorageAdapter = new LocalDiskStorageAdapter();
export const UPLOAD_DIR_PATH = UPLOAD_DIR;
