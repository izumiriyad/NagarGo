import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { env, isCloudinaryConfigured } from "../config/env";

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

// ---------------------------------------------------------------------------
// Local disk adapter (development / no-CDN fallback)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Cloudinary adapter (production)
// ---------------------------------------------------------------------------

class CloudinaryStorageAdapter implements StorageAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly cloudName: string;

  constructor(cloudinaryUrl: string) {
    // cloudinaryUrl format: cloudinary://api_key:api_secret@cloud_name
    const url = new URL(cloudinaryUrl);
    this.apiKey = url.username;
    this.apiSecret = url.password;
    this.cloudName = url.hostname;
    this.baseUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
  }

  async save(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile> {
    assertUploadIsAllowed(mimeType, buffer.length);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = `nagargo/${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const folder = "nagargo";

    // Build the signature string (Cloudinary requirement)
    const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash("sha256").update(toSign).digest("hex");

    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append("file", blob, originalName);
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp);
    formData.append("public_id", publicId);
    formData.append("folder", folder);
    formData.append("signature", signature);

    const res = await fetch(this.baseUrl, { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Cloudinary upload failed: ${res.status} ${body}`);
    }

    const data = await res.json() as { secure_url: string; public_id: string };
    return { key: data.public_id, url: data.secure_url };
  }
}

// ---------------------------------------------------------------------------
// Export the active adapter
// ---------------------------------------------------------------------------

export const storageAdapter: StorageAdapter = isCloudinaryConfigured
  ? new CloudinaryStorageAdapter(env.CLOUDINARY_URL!)
  : new LocalDiskStorageAdapter();

export const UPLOAD_DIR_PATH = UPLOAD_DIR;
