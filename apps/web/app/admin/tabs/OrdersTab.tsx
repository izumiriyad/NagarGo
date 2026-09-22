"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { StatusBadge, AdminButton, EmptyState } from "@/components/admin/AdminUI";

const STATUSES = [
  "ALL",
  "CREATED",
  "PAYMENT_PENDING",
  "PAYMENT_SUBMITTED",
  "PAYMENT_VERIFICATION_PENDING",
  "PAYMENT_CONFIRMED",
  "SEARCHING_RIDER",
  "RIDER_ASSIGNED",
  "RIDER_ACCEPTED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "DISPUTED",
];

const PAGE_SIZE = 25;

export function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(
    async (p = page, status = statusFilter, q = search) => {
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
        if (status !== "ALL") qs.set("status", status);
        if (q.trim()) qs.set("search", q.trim());
        const r = await api<any>(`/admin/orders?${qs}`);
        setOrders(r.orders);
        setPages(r.pages ?? 1);
        setTotal(r.total ?? r.orders?.length ?? 0);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    load(1, statusFilter, search);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

  async function cancelOrder(id: string) {
    if (!confirm("Cancel this order?")) return;
    setActionLoading(id + "_cancel");
    try {
      await api<any>(`/orders/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Cancelled by admin." }),
      });
      await load(page, statusFilter, search);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function dispatchOrder(id: string) {
    setActionLoading(id + "_dispatch");
    try {
      await api<any>(`/orders/${id}/dispatch`, { method: "POST" });
      await load(page, statusFilter, search);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-1">
          <input
            className="rounded-xl border border-ink/15 px-4 py-2 text-sm"
            placeholder="Search by ID or address…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm font-semibold transition hover:bg-black/5"
          >
            Search
          </button>
        </form>
        <select
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All statuses" : s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          onClick={() => load(page, statusFilter, search)}
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm font-semibold transition hover:bg-black/5"
        >
          ↻ Refresh
        </button>
        <span className="text-sm text-ink/40">
          {total} order{total !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <EmptyState message="No orders match your filter." />
      )}

      {!loading && orders.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
                  <th className="py-2 pr-4 font-semibold">Order</th>
                  <th className="py-2 pr-4 font-semibold">Route</th>
                  <th className="py-2 pr-4 font-semibold">Fare</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Created</th>
                  <th className="py-2 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <>
                    <tr
                      key={o._id}
                      className="cursor-pointer border-b border-ink/5 align-top transition hover:bg-black/[0.02]"
                      style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                      onClick={() => setExpandedId(expandedId === o._id ? null : o._id)}
                    >
                      <td className="py-3 pr-4">
                        <span className="font-semibold">{o.publicId}</span>
                        {o.isEmergency && (
                          <span className="ml-1.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                            URGENT
                          </span>
                        )}
                      </td>
                      <td className="max-w-xs py-3 pr-4">
                        <span className="line-clamp-1 text-ink/70">
                          {o.pickup?.fullAddress} → {o.destination?.fullAddress}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-semibold">৳{o.pricing?.total ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3 pr-4 text-ink/50">
                        {new Date(o.createdAt).toLocaleDateString()}{" "}
                        <span className="text-ink/30">
                          {new Date(o.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {o.status === "SEARCHING_RIDER" && (
                            <AdminButton
                              tone="primary"
                              disabled={actionLoading === o._id + "_dispatch"}
                              onClick={() => dispatchOrder(o._id)}
                            >
                              {actionLoading === o._id + "_dispatch" ? "…" : "Dispatch"}
                            </AdminButton>
                          )}
                          {!["CANCELLED", "DELIVERED", "FAILED"].includes(o.status) && (
                            <AdminButton
                              tone="danger"
                              disabled={actionLoading === o._id + "_cancel"}
                              onClick={() => cancelOrder(o._id)}
                            >
                              {actionLoading === o._id + "_cancel" ? "…" : "Cancel"}
                            </AdminButton>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === o._id && (
                      <tr key={o._id + "_detail"} className="bg-black/[0.015]">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid gap-4 text-xs sm:grid-cols-3">
                            <div>
                              <p className="font-bold uppercase tracking-wide text-ink/40">Item</p>
                              <p className="mt-1 font-semibold">{o.item?.name ?? "—"}</p>
                              <p className="text-ink/50">
                                {o.item?.category} · qty {o.item?.quantity ?? 1}
                              </p>
                            </div>
                            <div>
                              <p className="font-bold uppercase tracking-wide text-ink/40">Pricing breakdown</p>
                              <div className="mt-1 space-y-0.5">
                                <div className="flex justify-between">
                                  <span>Base</span>
                                  <span>৳{o.pricing?.baseFare}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Distance ({o.pricing?.distanceKm} km)</span>
                                  <span>৳{o.pricing?.distanceFare}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Service fee</span>
                                  <span>৳{o.pricing?.serviceFee}</span>
                                </div>
                                {o.pricing?.surcharges > 0 && (
                                  <div className="flex justify-between text-amber-600">
                                    <span>Surcharge</span>
                                    <span>৳{o.pricing?.surcharges}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold">
                                  <span>Total</span>
                                  <span>৳{o.pricing?.total}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="font-bold uppercase tracking-wide text-ink/40">Status history</p>
                              <ol className="mt-1 space-y-1">
                                {(o.statusHistory ?? []).slice(-5).map((h: any, j: number) => (
                                  <li key={j} className="flex gap-2">
                                    <span className="font-mono text-ink/30">
                                      {new Date(
                                        h.at ?? h.createdAt ?? Date.now()
                                      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <span>{h.status?.replaceAll("_", " ")}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); load(p, statusFilter, search); }}
                className="rounded-lg border border-ink/15 px-3 py-1.5 font-semibold disabled:opacity-40 transition hover:bg-black/5"
              >
                ← Prev
              </button>
              <span className="text-ink/50">
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => { const p = page + 1; setPage(p); load(p, statusFilter, search); }}
                className="rounded-lg border border-ink/15 px-3 py-1.5 font-semibold disabled:opacity-40 transition hover:bg-black/5"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
