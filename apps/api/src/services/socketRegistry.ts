import type { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

export function registerSocketServer(io: SocketIOServer) {
  ioInstance = io;
}

/** Room name a recipient's own client(s) should join on connect to receive push events. */
export function recipientRoom(recipientType: "USER" | "RIDER" | "ADMIN", recipientId: string) {
  return `recipient:${recipientType}:${recipientId}`;
}

export function emitToRecipient(recipientType: "USER" | "RIDER" | "ADMIN", recipientId: string, event: string, payload: unknown) {
  ioInstance?.to(recipientRoom(recipientType, recipientId)).emit(event, payload);
}

/** Emit to all connected admin clients (used for live dashboard updates). */
export function broadcastToAdmins(event: string, payload: unknown) {
  ioInstance?.to("role:ADMIN").emit(event, payload);
}

/** Emit to a raw room string (for order-specific rooms etc). */
export function emitToRoom(room: string, event: string, payload: unknown) {
  ioInstance?.to(room).emit(event, payload);
}
