import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { env, allowedOrigins } from "./config/env";
import { connectDB } from "./config/db";
import { ensureBootstrapAdmin } from "./controllers/adminAuthController";
import { ensureDefaultCityAndPricing } from "./services/seedService";
import { verifyAccessToken } from "./services/jwtService";
import { registerSocketServer, recipientRoom } from "./services/socketRegistry";
import { startDispatchScheduler } from "./services/dispatchScheduler";
import { telegramService } from "./services/telegramService";
import cron from "node-cron";
import { runDatabaseBackup } from "./scripts/backup";

import { logger } from "./config/logger";

async function main() {
  await connectDB();
  await ensureBootstrapAdmin();
  await ensureDefaultCityAndPricing();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });
  registerSocketServer(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload) {
      next(new Error("Unauthorized"));
      return;
    }
    socket.data.auth = payload;
    next();
  });

  io.on("connection", (socket) => {
    const auth = socket.data.auth as { sub: string; role: "CUSTOMER" | "RIDER" | "ADMIN" } | undefined;
    if (auth) {
      const recipientType = auth.role === "CUSTOMER" ? "USER" : auth.role === "RIDER" ? "RIDER" : "ADMIN";
      socket.join(recipientRoom(recipientType, auth.sub));

      // Admin clients also join the broadcast room so broadcastToAdmins()
      // reaches their live dashboard without knowing individual socket IDs.
      if (auth.role === "ADMIN") {
        socket.join("role:ADMIN");
      }
    }

    socket.on("order:join", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("rider:location", async (data: { orderId?: string; lat: number; lng: number }) => {
      if (socket.data.auth?.role !== "RIDER") return;
      if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return;
      const riderId = socket.data.auth.sub;
      const { Rider } = await import("./models/Rider");
      const { Order } = await import("./models/Order");
      await Rider.findByIdAndUpdate(riderId, { currentLocation: { lat: data.lat, lng: data.lng, updatedAt: new Date() } });
      if (data.orderId) {
        const order = await Order.findById(data.orderId).select("riderId customerId status");
        if (!order || String(order.riderId) !== riderId) return;
        io.to(`order:${data.orderId}`).emit("order:rider-location", { orderId: data.orderId, lat: data.lat, lng: data.lng, timestamp: Date.now() });
      }
    });

    socket.on("order:stop-tracking", (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });
  });

  startDispatchScheduler();
  await telegramService.startTelegramPolling();

  cron.schedule("0 3 * * *", () => {
    runDatabaseBackup();
  });

  httpServer.listen(env.PORT, () => {
    logger.info(`[api] NagarGo API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n[api] Received ${signal}. Starting graceful shutdown...`);
    httpServer.close(async () => {
      console.log("[api] HTTP server closed.");
      try {
        const mongoose = await import("mongoose");
        await mongoose.connection.close(false);
        console.log("[api] MongoDB connection closed.");
        process.exit(0);
      } catch (err) {
        console.error("[api] Error during shutdown:", err);
        process.exit(1);
      }
    });
    
    // Force close if it takes too long
    setTimeout(() => {
      console.error("[api] Could not close connections in time, forcefully shutting down.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[api] Fatal startup error:", err);
  process.exit(1);
});
