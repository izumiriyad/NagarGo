import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/** Lazily creates (or reuses) a single authenticated socket connection for this tab. */
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("nagargo_access_token");
  if (!token) return null;

  if (socket && socket.connected) return socket;

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "");
  socket = io(base, { auth: { token }, transports: ["websocket", "polling"] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
