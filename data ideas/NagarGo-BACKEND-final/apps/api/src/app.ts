import "express-async-errors"; // lets thrown/rejected errors in async handlers reach errorHandler
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { generalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { env, allowedOrigins } from "./config/env";
import { UPLOAD_DIR_PATH } from "./services/storageService";

import authRoutes from "./routes/authRoutes";
import orderRoutes from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import adminRoutes from "./routes/adminRoutes";
import riderRoutes from "./routes/riderRoutes";
import medicineRoutes from "./routes/medicineRoutes";
import extraRoutes from "./routes/extraRoutes";
import cityRoutes from "./routes/cityRoutes";
import dispatchRoutes from "./routes/dispatchRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import notificationRoutes from "./routes/notificationRoutes";

export function createApp() {
  const app = express();

  // The deployed service sits behind a reverse proxy, which supplies
  // X-Forwarded-For. Trust the first proxy so rate limiting identifies
  // the real client instead of treating the proxy as the user.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow no-Origin requests (server-to-server, curl, health
        // checks) and any origin explicitly listed in APP_BASE_URL.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin "${origin}" is not in APP_BASE_URL.`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(generalRateLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Dev-only static file serving for the local disk storage adapter.
  // Production storage (Cloudinary/S3) serves files from its own CDN
  // and this line becomes unnecessary — see storageService.ts.
  app.use("/uploads", express.static(UPLOAD_DIR_PATH));

  app.use("/api/auth", authRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/riders", riderRoutes);
  app.use("/api/medicine-orders", medicineRoutes);
  app.use("/api", extraRoutes);
  app.use("/api/cities", cityRoutes);
  app.use("/api", dispatchRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/notifications", notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
