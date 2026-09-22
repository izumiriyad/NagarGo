import { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { storageAdapter } from "../services/storageService";

/**
 * Generic authenticated file upload used by rider NID/document
 * submission and Medicine Express prescription uploads. Any signed-in
 * customer, rider, or admin may upload — authorization for what the
 * resulting URL is attached to is enforced by the endpoint that
 * later saves it (e.g. rider registration, medicine order creation).
 */
export async function uploadFile(req: Request, res: Response) {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) throw new AppError("No file was uploaded.", 400);

  try {
    const stored = await storageAdapter.save(file.buffer, file.originalname, file.mimetype);
    res.status(201).json({ url: stored.url });
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : "Upload failed.", 400);
  }
}
