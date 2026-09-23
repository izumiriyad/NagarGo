"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) {
      router.replace("/login?next=/notifications");
      return;
    }

    async function load() {
      try {
        const r = await api<any>("/notifications?limit=100");
        setItems(r.notifications ?? []);
        // Mark all read
        await api<any>("/notifications/read-all", { method: "POST" }).catch(() => {});
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const typeIcon: Record<string, string> = {
    ORDER_STATUS_CHANGED: "📦",
    ORDER_ASSIGNED: "🏍️",
    DISPUTE_RESOLVED: "⚖️",
    RIDER_APPROVED: "✅",
    RIDER_REJECTED: "❌",
    MEDICINE_ORDER_REVIEWED: "💊",
    PAYMENT_RECEIVED: "💳",
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl animate-fade-up px-5 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Notifications</h1>
            <p className="mt-1 text-sm text-ink/50">All your alerts in one place</p>
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {loading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="mt-16 rounded-3xl border border-dashed border-ink/15 p-16 text-center">
            <p className="text-4xl">🔔</p>
            <p className="mt-4 font-display text-lg font-bold text-ink">All caught up!</p>
            <p className="mt-2 text-sm text-ink/50">No notifications yet. They'll show up here.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mt-6 space-y-2">
            {items.map((n, i) => (
              <div
                key={n._id ?? i}
                className={`animate-fade-up rounded-2xl border p-4 transition ${
                  n.readAt
                    ? "border-ink/8 bg-white"
                    : "border-green-200 bg-green-50"
                }`}
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-xl">
                    {typeIcon[n.type] ?? "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug text-ink">{n.title}</p>
                      {!n.readAt && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink/60">{n.body}</p>
                    <p className="mt-2 text-xs text-ink/30">
                      {new Date(n.createdAt).toLocaleString("en-BD", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
