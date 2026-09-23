"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    try {
      const r = await api<any>("/notifications");
      setItems(r.notifications);
      setUnread(r.unreadCount);
    } catch {
      // Not signed in yet — silently show nothing.
    }
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    if (!socket) return;
    const onNew = (n: any) => {
      setItems((prev) => [n, ...prev].slice(0, 100));
      setUnread((c) => c + 1);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(n.title, { body: n.body, icon: "/nagargo-mark.png" });
      }
    };
    socket.on("notification:new", onNew);
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
    return () => { socket.off("notification:new", onNew); };
  }, []);

  async function markAllRead() {
    await api<any>("/notifications/read-all", { method: "POST" });
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  return (
    <div className="relative">
      <button onClick={() => { setOpen((o) => !o); if (!open) markAllRead(); }} className="relative rounded-full border border-ink/15 p-2 text-ink/70 hover:bg-black/5" aria-label="Notifications">
        🔔
        {unread > 0 && <span className="animate-badge-pop absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-ink/10 bg-white p-2 shadow-xl">
          {items.length === 0 && <p className="p-4 text-center text-sm text-ink/40">No notifications yet.</p>}
          <div className="max-h-96 overflow-auto">
            {items.map((n, i) => (
              <div key={n._id} className={`animate-fade-up rounded-xl p-3 text-sm ${n.readAt ? "" : "bg-route-green/5"}`} style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
                <p className="font-semibold text-ink">{n.title}</p>
                <p className="mt-1 text-ink/60">{n.body}</p>
                <p className="mt-1 text-xs text-ink/30">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
