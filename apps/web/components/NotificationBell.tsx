"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

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
    };
    socket.on("notification:new", onNew);
    return () => { socket.off("notification:new", onNew); };
  }, []);

  // Close dropdown when clicking outside.
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  async function markAllRead() {
    try {
      await api<any>("/notifications/read-all", { method: "POST" });
    } catch {
      // Optimistic — continue even if the request fails.
    }
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markAllRead();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative rounded-full border border-ink/15 p-2 text-ink/70 transition hover:bg-black/5"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        🔔
        {unread > 0 && (
          <span className="animate-badge-pop absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-ink/10 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
            <span className="text-sm font-bold text-ink">Notifications</span>
            {items.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-route-green hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto p-2">
            {items.length === 0 && (
              <p className="p-4 text-center text-sm text-ink/40">No notifications yet.</p>
            )}
            {items.map((n, i) => (
              <div
                key={n._id ?? i}
                className={`animate-fade-up rounded-xl p-3 text-sm transition hover:bg-black/[0.03] ${
                  n.readAt ? "" : "bg-route-green/5"
                }`}
                style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-snug text-ink">{n.title}</p>
                  {!n.readAt && (
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-route-green" />
                  )}
                </div>
                <p className="mt-1 leading-snug text-ink/60">{n.body}</p>
                <p className="mt-1 text-xs text-ink/30">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
