import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { env, allowedOrigins } from "./config/env";
import { connectDB } from "./config/db";
import { ensureBootstrapAdmin } from "./controllers/adminAuthController";
import { ensureDefaultCityAndPricing } from "./services/seedService";
import { verifyAccessToken } from "./services/jwtService";
import { registerSocketServer, recipientRoom } from "./services/socketRegistry";
import { startTelegramAdminPolling } from "./services/telegramService";
import { startDispatchScheduler } from "./services/dispatchScheduler";

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

  // Riders join a room per active order and stream location updates;
  // customers/admins join the same room to receive them. Every
  // socket must present a valid JWT — no anonymous location writes.
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
    // Every authenticated socket auto-joins its own notification
    // room so notificationService.notify() can push instantly.
    const auth = socket.data.auth as { sub: string; role: "CUSTOMER" | "RIDER" | "ADMIN" } | undefined;
    if (auth) {
      const recipientType = auth.role === "CUSTOMER" ? "USER" : auth.role === "RIDER" ? "RIDER" : "ADMIN";
      socket.join(recipientRoom(recipientType, auth.sub));
    }

    socket.on("order:join", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    const broadcastLocation = (event: "order:rider-location" | "order:customer-location", data: { orderId: string; lat: number; lng: number }) => {
      if (!data?.orderId || !Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return;
      if (data.lat < -90 || data.lat > 90 || data.lng < -180 || data.lng > 180) return;
      io.to(`order:${data.orderId}`).emit(event, { ...data, timestamp: Date.now() });
    };

    socket.on("rider:location", (data: { orderId: string; lat: number; lng: number }) => {
      if (socket.data.auth?.role !== "RIDER") return;
      broadcastLocation("order:rider-location", data);
    });

    socket.on("customer:location", (data: { orderId: string; lat: number; lng: number }) => {
      if (socket.data.auth?.role !== "CUSTOMER") return;
      broadcastLocation("order:customer-location", data);
    });

    socket.on("order:stop-tracking", (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });
  });

  startDispatchScheduler();
  startTelegramAdminPolling();

  httpServer.listen(env.PORT, () => {
    console.log(`[api] NagarGo API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error("[api] Fatal startup error:", err);
  process.exit(1);
});
