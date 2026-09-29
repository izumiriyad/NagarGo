"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState } from "@/components/EmptyState";

export default function MedicineOrdersList() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/medicine-orders"); return; }
    api<any>("/medicine-orders?limit=50")
      .then((r) => setOrders(r.orders ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl animate-fade-up px-5 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Medicine Orders</h1>
            <p className="mt-1 text-sm text-ink/50">All your prescription order requests</p>
          </div>
          <a
            href="/medicine"
            className="rounded-full bg-route-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-route-green-dark"
          >
            + New order
          </a>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {loading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && !error && (
          <EmptyState
            icon="💊"
            title="No medicine orders yet"
            body="Submit your first prescription and we'll get it delivered."
            className="mt-12"
          />
        )}

        {!loading && orders.length > 0 && (
          <div className="mt-6 space-y-3">
            {orders.map((order, i) => (
              <a
                key={order._id}
                href={`/medicine-orders/${order._id}`}
                className="animate-fade-up block rounded-2xl border border-ink/10 bg-white p-5 transition hover:border-route-green/30 hover:shadow-md"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-ink/30">Medicine Order</p>
                    <p className="mt-0.5 font-display text-lg font-bold text-ink">{order.publicId}</p>
                    <p className="mt-1 text-sm text-ink/50 line-clamp-1">
                      {order.pharmacyName ? `from ${order.pharmacyName}` : "Any pharmacy"}
                      {order.items?.length ? ` · ${order.items.length} item${order.items.length !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <OrderStatusBadge status={order.status} />
                    <p className="mt-1.5 text-xs text-ink/30">
                      {new Date(order.createdAt).toLocaleDateString("en-BD", { dateStyle: "medium" })}
                    </p>
                  </div>
                </div>
                {order.pricing?.total > 0 && (
                  <p className="mt-3 text-sm font-semibold text-route-green-dark">৳{order.pricing.total}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
