"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function OrderReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) {
      router.replace(`/login?next=/orders/${id}/receipt`);
      return;
    }
    api<{ receipt: any }>(`/orders/${id}/receipt`)
      .then((r) => setReceipt(r.receipt))
      .catch((e) => setError(e.message ?? "Could not load receipt."))
      .finally(() => setLoading(false));
  }, [id, router]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-lg mx-auto">
          {loading && (
            <div className="text-center py-20 text-gray-400 text-lg animate-pulse">
              Loading receipt…
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-5 py-4 text-sm">
              {error}
            </div>
          )}

          {receipt && (
            <div
              id="receipt-content"
              className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden print:shadow-none"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-500 px-6 py-8 text-white text-center print:bg-green-600">
                <div className="text-4xl mb-2">✅</div>
                <h1 className="text-2xl font-bold">Delivery Receipt</h1>
                <p className="text-white/80 text-sm mt-1">NagarGo Hyperlocal Delivery</p>
              </div>

              {/* Order meta */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-gray-500 text-sm">Order ID</span>
                <span className="font-mono font-bold text-gray-900">{receipt.receiptNumber}</span>
              </div>
              <div className="px-6 py-2 border-b border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-400">Receipt issued</span>
                <span className="text-gray-600">{receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleString() : "—"}</span>
              </div>

              {/* Route */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Route</p>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-3">
                    <span className="text-green-500 mt-0.5 shrink-0">📍</span>
                    <div>
                      <span className="font-medium text-gray-700">Pickup</span>
                      <p className="text-gray-500">{receipt.pickup?.fullAddress}</p>
                      {receipt.pickup?.landmark && (
                        <p className="text-gray-400 text-xs">Near: {receipt.pickup.landmark}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-500 mt-0.5 shrink-0">🏁</span>
                    <div>
                      <span className="font-medium text-gray-700">Destination</span>
                      <p className="text-gray-500">{receipt.destination?.fullAddress}</p>
                      {receipt.destination?.landmark && (
                        <p className="text-gray-400 text-xs">Near: {receipt.destination.landmark}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Item */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Item</p>
                <p className="font-semibold text-gray-900">{receipt.item?.name}</p>
                <p className="text-sm text-gray-500">
                  {receipt.item?.category}
                  {receipt.item?.quantity > 1 ? ` · qty ${receipt.item.quantity}` : ""}
                </p>
                {receipt.order?.isEmergency && (
                  <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                    URGENT
                  </span>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pricing Breakdown</p>
                <dl className="space-y-1.5 text-sm">
                  {[
                    ["Base fare", `৳${receipt.pricing?.baseFare}`],
                    [`Distance (${receipt.pricing?.distanceKm} km)`, `৳${receipt.pricing?.distanceFare}`],
                    ["Service fee", `৳${receipt.pricing?.serviceFee}`],
                    ...(receipt.pricing?.surcharges > 0
                      ? [["Surcharge", `৳${receipt.pricing.surcharges}`]]
                      : []),
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex justify-between">
                      <dt className="text-gray-500">{label}</dt>
                      <dd className="text-gray-800">{val}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-base">
                    <dt>Total Paid</dt>
                    <dd className="text-green-700">৳{receipt.pricing?.total}</dd>
                  </div>
                </dl>
              </div>

              {/* Payment method */}
              {receipt.payment && (
                <div className="px-6 py-4 border-b border-gray-100 text-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment</p>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method</span>
                    <span className="font-medium text-gray-800">{String(receipt.payment.method ?? "—").replaceAll("_", " ")}</span>
                  </div>
                  {receipt.payment.transactionId && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-mono text-gray-700">{receipt.payment.transactionId}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Timeline</p>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Order placed</dt>
                    <dd className="text-gray-800">
                      {receipt.order?.createdAt
                        ? new Date(receipt.order.createdAt).toLocaleString()
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Delivered</dt>
                    <dd className="text-gray-800 font-medium text-green-700">
                      {receipt.order?.deliveredAt
                        ? new Date(receipt.order.deliveredAt).toLocaleString()
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Footer note */}
              <div className="px-6 py-4 bg-gray-50 text-xs text-gray-400 text-center border-t border-gray-100">
                Thank you for choosing NagarGo — Rajshahi&apos;s hyperlocal delivery service.
              </div>
            </div>
          )}

          {/* Actions */}
          {receipt && (
            <div className="mt-6 flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => router.push("/orders")}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                ← My Orders
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
