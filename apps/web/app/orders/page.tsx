"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useI18n } from "@/i18n/LocaleProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useRouter } from "next/navigation";

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "SEARCHING_RIDER", label: "Searching" },
  { value: "RIDER_ASSIGNED", label: "Assigned" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DISPUTED", label: "Disputed" },
];

export default function OrdersPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Rating
  const [rateTarget, setRateTarget] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingDone, setRatingDone] = useState<Set<string>>(new Set());

  // Filter + cancel
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/orders"); return; }
    load(page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  // Real-time socket updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onChange = (data: { orderId: string; status: string }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === data.orderId ? { ...o, status: data.status } : o
        )
      );
    };
    socket.on("order:status-changed", onChange);
    return () => { socket.off("order:status-changed", onChange); };
  }, []);

  async function load(p: number, status: string) {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(p), limit: "15" });
      if (status) qs.set("status", status);
      const r = await api<any>(`/orders?${qs}`);
      setOrders(r.orders);
      setPages(r.pages);
      setTotal(r.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRating(orderId: string) {
    setRatingLoading(true);
    try {
      await api<any>(`/orders/${orderId}/rating`, {
        method: "POST",
        body: JSON.stringify({ rating: ratingValue, comment: ratingComment || undefined }),
      });
      setRatingDone(new Set([...ratingDone, orderId]));
      setRateTarget(null);
      setRatingComment("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRatingLoading(false);
    }
  }

  async function cancelOrder(orderId: string) {
    setCancelLoading(true);
    try {
      await api<any>(`/orders/${orderId}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Customer cancelled" }) });
      setCancelTarget(null);
      load(page, statusFilter);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCancelLoading(false);
    }
  }

  function reorder(o: any) {
    const params = new URLSearchParams({
      pickupAddress: o.pickup?.fullAddress ?? "",
      pickupLat: String(o.pickup?.lat ?? ""),
      pickupLng: String(o.pickup?.lng ?? ""),
      destAddress: o.destination?.fullAddress ?? "",
      destLat: String(o.destination?.lat ?? ""),
      destLng: String(o.destination?.lng ?? ""),
      category: o.item?.category ?? "PARCEL",
    });
    router.push(`/book?${params}`);
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl animate-fade-up px-5 py-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">{t("orders.title")}</h1>
            {!loading && total > 0 && (
              <p className="mt-1 text-sm text-ink/50">{total} orders total</p>
            )}
          </div>
          <a
            href="/book"
            className="rounded-full bg-route-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-route-green-dark"
          >
            New delivery
          </a>
        </div>

        {/* Filter pills */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === opt.value
                  ? "bg-ink text-white"
                  : "border border-ink/15 text-ink/60 hover:bg-black/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {/* Loading */}
        {loading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <EmptyState
            icon="📦"
            title="No orders yet"
            body={statusFilter ? `No orders with status "${statusFilter.replaceAll("_", " ")}".` : "Your delivery history will appear here."}
            cta={{ label: "Book your first delivery", href: "/book" }}
            className="mt-8"
          />
        )}

        {/* Orders */}
        {!loading && orders.length > 0 && (
          <div className="mt-6 space-y-3">
            {orders.map((o, i) => {
              const canCancel = ["CREATED", "PAYMENT_PENDING", "PAYMENT_CONFIRMED", "SEARCHING_RIDER"].includes(o.status);
              const canRate = o.status === "DELIVERED" && !ratingDone.has(o._id) && !o.ratedAt;
              const canReorder = ["DELIVERED", "CANCELLED"].includes(o.status);
              return (
                <div
                  key={o._id}
                  className="animate-fade-up rounded-2xl border border-ink/10 bg-white p-5 transition hover:shadow-md"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <a
                        href={`/orders/${o._id}/track`}
                        className="font-display text-base font-bold text-ink transition hover:text-route-green"
                      >
                        {o.publicId}
                      </a>
                      <p className="mt-0.5 text-sm text-ink/50 line-clamp-1">
                        {o.pickup?.fullAddress} → {o.destination?.fullAddress}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/30">
                        {new Date(o.createdAt).toLocaleDateString("en-BD", { dateStyle: "medium" })}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} showDot />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-ink/8 pt-3">
                    <span className="font-semibold text-ink">৳{o.pricing?.total ?? "—"}</span>

                    <div className="flex flex-wrap items-center gap-2">
                      {canReorder && (
                        <button
                          onClick={() => reorder(o)}
                          className="rounded-full border border-route-green/40 px-3 py-1.5 text-xs font-semibold text-route-green-dark transition hover:bg-route-green/10"
                        >
                          ↩ Re-order
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => setCancelTarget(o._id)}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}
                      <a
                        href={`/orders/${o._id}/track`}
                        className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink/80"
                      >
                        {o.status === "DELIVERED" ? "Receipt" : "Track"} →
                      </a>
                    </div>
                  </div>

                  {/* Rate order */}
                  {canRate && (
                    <div className="mt-3 border-t border-ink/8 pt-3">
                      {rateTarget !== o._id ? (
                        <button
                          onClick={() => setRateTarget(o._id)}
                          className="text-sm font-semibold text-amber-600 underline underline-offset-2 transition hover:text-amber-700"
                        >
                          ⭐ Rate this delivery
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setRatingValue(n)}
                                className={`text-xl transition hover:scale-110 ${n <= ratingValue ? "text-amber-400" : "text-ink/20"}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <input
                            className="w-full rounded-xl border border-ink/15 p-2.5 text-sm focus:border-route-green focus:outline-none"
                            placeholder="Leave a comment (optional)"
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitRating(o._id)}
                              disabled={ratingLoading}
                              className="rounded-lg bg-route-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {ratingLoading ? "Submitting…" : "Submit rating"}
                            </button>
                            <button
                              onClick={() => setRateTarget(null)}
                              className="rounded-lg border border-ink/15 px-4 py-2 text-sm"
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {ratingDone.has(o._id) && (
                    <p className="mt-2 text-xs text-route-green-dark">✓ Rated — thank you!</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-black/5 transition"
            >
              ← Prev
            </button>
            <span className="text-sm text-ink/50">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-black/5 transition"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Cancel confirm modal */}
      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel this order?"
        body="The rider has not been assigned yet. Cancellation is free at this stage."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep order"
        destructive
        loading={cancelLoading}
        onConfirm={() => cancelTarget && cancelOrder(cancelTarget)}
        onCancel={() => setCancelTarget(null)}
      />

      <Footer />
    </>
  );
}
