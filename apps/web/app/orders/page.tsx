"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/LocaleProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "bg-route-green/10 text-route-green-dark",
  CANCELLED: "bg-red-50 text-red-600",
  FAILED: "bg-red-50 text-red-600",
  DISPUTED: "bg-amber-50 text-amber-700",
  IN_TRANSIT: "bg-blue-50 text-blue-700",
  SEARCHING_RIDER: "bg-yellow-50 text-yellow-700",
  RIDER_ASSIGNED: "bg-blue-50 text-blue-700",
  PAYMENT_PENDING: "bg-yellow-50 text-yellow-700",
};

function statusLabel(s: string) {
  return s.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function OrdersPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rateTarget, setRateTarget] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingDone, setRatingDone] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/orders"); return; }
    load(page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

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

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl animate-fade-up px-5 py-12">
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

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {loading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="mt-12 rounded-3xl border border-dashed border-ink/15 p-12 text-center">
            <p className="text-4xl">📦</p>
            <p className="mt-4 font-display text-lg font-bold">{t("orders.empty")}</p>
            <a
              href="/book"
              className="mt-4 inline-block rounded-xl bg-route-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-route-green-dark"
            >
              Book a delivery
            </a>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div
              key={o._id}
              className="animate-fade-up rounded-2xl border border-ink/10 bg-white p-5 transition hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold">{o.publicId}</span>
                    {o.isEmergency && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-md truncate text-xs text-ink/50">
                    {o.pickup?.fullAddress} → {o.destination?.fullAddress}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    STATUS_COLORS[o.status] ?? "bg-black/5 text-ink/60"
                  }`}
                >
                  {statusLabel(o.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/5 pt-3">
                <div className="text-sm">
                  <span className="font-bold text-ink">৳{o.pricing?.total ?? "—"}</span>
                  <span className="ml-2 text-ink/40">
                    {o.pricing?.distanceKm} km · {o.pricing?.estimatedMinutes} min est.
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/orders/${o._id}/track`}
                    className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                  >
                    {t("orders.track")}
                  </a>
                  {o.status === "DELIVERED" && !o.ratedByCustomer && !ratingDone.has(o._id) && (
                    <button
                      onClick={() => setRateTarget(o._id)}
                      className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      {t("orders.rate")} ⭐
                    </button>
                  )}
                  {ratingDone.has(o._id) && (
                    <span className="rounded-lg bg-route-green/10 px-3 py-1.5 text-xs font-semibold text-route-green-dark">
                      Rated ✓
                    </span>
                  )}
                  {o.status === "DELIVERED" && (
                    <a
                      href={`/orders/${o._id}/receipt`}
                      className="rounded-lg border border-route-green/30 px-3 py-1.5 text-xs font-semibold text-route-green-dark transition hover:bg-route-green/5"
                    >
                      🧾 Receipt
                    </a>
                  )}
                </div>
              </div>

              {/* Inline rating form */}
              {rateTarget === o._id && (
                <div className="mt-4 animate-fade-up rounded-2xl bg-amber-50 p-4">
                  <p className="mb-2 text-sm font-semibold">Rate your delivery</p>
                  <div className="flex gap-2 text-2xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingValue(star)}
                        className={`transition ${ratingValue >= star ? "opacity-100" : "opacity-30"}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="mt-3 w-full rounded-xl border border-ink/15 p-3 text-sm"
                    placeholder="Leave a comment (optional)"
                    rows={2}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={ratingLoading}
                      onClick={() => submitRating(o._id)}
                      className="rounded-xl bg-route-green px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {ratingLoading ? "Submitting…" : "Submit rating"}
                    </button>
                    <button
                      onClick={() => setRateTarget(null)}
                      className="rounded-xl border border-ink/15 px-4 py-2 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="flex items-center px-4 text-sm text-ink/50">
              {page} / {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
