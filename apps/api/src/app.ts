import "express-async-errors"; // lets thrown/rejected errors in async handlers reach errorHandler
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import { logger } from "./config/logger";
import mongoSanitize from "express-mongo-sanitize";
import { generalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestIdMiddleware } from "./middleware/auth";
import { allowedOrigins } from "./config/env";
import { UPLOAD_DIR_PATH } from "./services/storageService";
import { setupSwagger } from "./config/swagger";
import promClient from "prom-client";
import mongoose from "mongoose";
import { redisClient } from "./config/redis";

// Initialize Prometheus Default Metrics (RAM, CPU, Event Loop)
promClient.collectDefaultMetrics({ prefix: 'nagargo_api_' });

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

  // Setup Interactive API Portal (Swagger)
  setupSwagger(app);

  // Expose Prometheus Metrics endpoint with optional METRICS_SECRET guard
  app.get("/metrics", async (req, res) => {
    const metricsSecret = process.env.METRICS_SECRET;
    if (metricsSecret) {
      const providedSecret = req.query.secret || req.headers["x-metrics-secret"];
      if (providedSecret !== metricsSecret) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }
    res.set("Content-Type", promClient.register.contentType);
    res.send(await promClient.register.metrics());
  });

  // Correlation ID — must be first so all log lines carry the request ID
  app.use(requestIdMiddleware);

  // Security & Performance
  app.use(helmet());
  app.use(compression());
  app.use(pinoHttp({ logger }));
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
  app.use(mongoSanitize()); // Prevent NoSQL injection
  app.use(generalRateLimiter);

  // Enriched health check with DB and Redis ping
  app.get("/health", async (_req, res) => {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
        redis: "disconnected",
      },
    };

    // Check MongoDB connection
    try {
      // mongoose.connection.readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (mongoose.connection.readyState === 1) {
        health.services.database = "connected";
      }
    } catch (error) {
      health.services.database = "error";
    }

    // Check Redis connection
    try {
      if (redisClient && typeof redisClient.ping === "function") {
        await redisClient.ping();
        health.services.redis = "connected";
      }
    } catch (error) {
      health.services.redis = "error";
    }

    const isHealthy =
      health.services.database === "connected" &&
      health.services.redis === "connected";

    if (!isHealthy) {
      health.status = "degraded";
      return res.status(503).json(health);
    }

    return res.json(health);
  });

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
