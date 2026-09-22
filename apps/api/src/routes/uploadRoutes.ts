import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { uploadFile } from "../controllers/uploadController";

// Memory storage: files are validated and handed to the storage
// adapter (see storageService.ts) rather than trusted to multer's
// own disk handling, so swapping to Cloudinary/S3 later is a
// one-file change.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const router = Router();
router.post("/", requireAuth, upload.single("file"), uploadFile);
export default router;
