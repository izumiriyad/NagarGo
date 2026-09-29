"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState } from "@/components/EmptyState";

export default function MedicineOrderDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/medicine"); return; }
    api<any>(`/medicine-orders/${params.id}`)
      .then((r) => setOrder(r.order))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl animate-fade-up px-5 py-12">
        <a
          href="/medicine"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/50 transition hover:text-ink"
        >
          ← Medicine Express
        </a>

        {loading && (
          <div className="space-y-4">
            <div className="skeleton h-10 w-48 rounded-xl" />
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-60 rounded-2xl" />
          </div>
        )}

        {error && (
          <EmptyState icon="⚠️" title="Order not found" body={error} className="mt-4" />
        )}

        {order && (
          <>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Medicine Order</p>
                <h1 className="mt-1 font-display text-3xl font-bold text-ink">{order.publicId}</h1>
                <p className="mt-1 text-sm text-ink/60">
                  Submitted {new Date(order.createdAt).toLocaleDateString("en-BD", { dateStyle: "medium" })}
                </p>
              </div>
              <OrderStatusBadge status={order.status} showDot />
            </div>

            {/* Status info box */}
            {order.status === "PENDING_REVIEW" && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-800">⏳ Under review</p>
                <p className="mt-1 text-sm text-amber-700">
                  Our pharmacist team is reviewing your order. This usually takes 1–2 hours during business hours.
                </p>
              </div>
            )}
            {order.status === "APPROVED" && (
              <div className="mt-6 rounded-2xl border border-route-green/20 bg-route-green/5 p-4">
                <p className="font-semibold text-route-green-dark">✅ Approved — rider dispatched</p>
                <p className="mt-1 text-sm text-route-green-dark/70">
                  Your medicine is on its way. Track the delivery in your orders.
                </p>
                {order.linkedOrderId && (
                  <a
                    href={`/orders/${order.linkedOrderId}/track`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-route-green underline underline-offset-2"
                  >
                    Track delivery →
                  </a>
                )}
              </div>
            )}
            {order.status === "REJECTED" && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-700">❌ Order rejected</p>
                {order.reviewNote && (
                  <p className="mt-1 text-sm text-red-600">Reason: {order.reviewNote}</p>
                )}
              </div>
            )}

            {/* Pharmacist note */}
            {order.reviewNote && order.status !== "REJECTED" && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">📋 Pharmacist note</p>
                <p className="mt-1 text-sm text-blue-700">{order.reviewNote}</p>
              </div>
            )}

            {/* Order details */}
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-ink/10 bg-white p-5">
                <h2 className="mb-3 font-display text-base font-bold text-ink">Pharmacy</h2>
                <p className="text-sm text-ink/70">{order.pharmacyName || "Any available"}</p>
                {order.deliveryAddress && (
                  <p className="mt-1 text-sm text-ink/50">📍 {order.deliveryAddress}</p>
                )}
              </div>

              {/* Items */}
              {order.items?.length > 0 && (
                <div className="rounded-2xl border border-ink/10 bg-white p-5">
                  <h2 className="mb-3 font-display text-base font-bold text-ink">Items requested</h2>
                  <ul className="divide-y divide-ink/8">
                    {order.items.map((item: any, i: number) => (
                      <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="text-ink">{item.name}</span>
                        <span className="font-semibold text-ink/50">×{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  {order.totalAmount > 0 && (
                    <div className="mt-3 border-t border-ink/8 pt-3">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-sm">Total</span>
                        <span className="text-route-green-dark">৳{order.totalAmount}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prescription */}
              {order.prescriptionUrl && (
                <div className="rounded-2xl border border-ink/10 bg-white p-5">
                  <h2 className="mb-3 font-display text-base font-bold text-ink">Prescription</h2>
                  <a
                    href={order.prescriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
                  >
                    📎 View attached prescription
                  </a>
                </div>
              )}

              {/* Notes */}
              {order.customerNote && (
                <div className="rounded-2xl border border-ink/10 bg-white p-5">
                  <h2 className="mb-2 font-display text-base font-bold text-ink">Your note</h2>
                  <p className="text-sm text-ink/60">{order.customerNote}</p>
                </div>
              )}
            </div>

            <a
              href="/medicine"
              className="mt-8 block text-center text-sm font-semibold text-ink/40 underline underline-offset-2 hover:text-ink/70 transition"
            >
              ← All medicine orders
            </a>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
