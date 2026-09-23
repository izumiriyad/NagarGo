"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LiveTrackingMap } from "@/components/maps/LiveTrackingMap";

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Order created",
  PAYMENT_PENDING: "Awaiting payment",
  PAYMENT_CONFIRMED: "Payment confirmed",
  SEARCHING_RIDER: "Finding a rider…",
  RIDER_ASSIGNED: "Rider assigned",
  RIDER_ACCEPTED: "Rider accepted",
  RIDER_ARRIVING: "Rider on the way",
  PICKUP_OTP_PENDING: "Show OTP at pickup",
  PICKED_UP: "Item picked up",
  IN_TRANSIT: "In transit",
  RIDER_AT_DESTINATION: "Rider at your door",
  DELIVERY_OTP_PENDING: "Show OTP for delivery",
  DELIVERED: "Delivered ✓",
  CANCELLED: "Cancelled",
  DISPUTED: "Under dispute",
};

export default function TrackOrder({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>();
  const [error, setError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("DELIVERY_ISSUE");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeMsg, setDisputeMsg] = useState("");

  async function load() {
    try {
      setOrder((await api<any>(`/orders/${params.id}`)).order);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, [params.id]); // eslint-disable-line

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onChange = (data: { orderId: string; status: string }) => {
      if (data.orderId === params.id) load();
    };
    socket.on("order:status-changed", onChange);
    return () => { socket.off("order:status-changed", onChange); };
  }, [params.id]); // eslint-disable-line

  async function requestOtp(stage: "pickup" | "delivery") {
    setOtpSending(true);
    setOtpCode(null);
    try {
      const r = await api<any>(`/orders/${params.id}/otp/${stage}`, { method: "POST" });
      setOtpCode(r.devDisplayCode ?? r.code ?? "Check app");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOtpSending(false);
    }
  }

  async function submitDispute(e: React.FormEvent) {
    e.preventDefault();
    setDisputeLoading(true);
    try {
      await api<any>("/disputes", {
        method: "POST",
        body: JSON.stringify({ orderId: params.id, reason: disputeReason, category: disputeCategory }),
      });
      setDisputeMsg("Dispute filed. Our admin team will review it within 24 hours.");
      setDisputeOpen(false);
    } catch (e: any) {
      setDisputeMsg(e.message);
    } finally {
      setDisputeLoading(false);
    }
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-12">
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-12">
          <div className="skeleton h-8 w-48 rounded-xl mb-4" />
          <div className="skeleton h-64 rounded-2xl" />
        </main>
        <Footer />
      </>
    );
  }

  const canRequestPickupOtp = ["RIDER_ASSIGNED", "RIDER_ACCEPTED", "RIDER_ARRIVING", "PICKUP_OTP_PENDING"].includes(order.status);
  const canRequestDeliveryOtp = ["IN_TRANSIT", "RIDER_AT_DESTINATION", "DELIVERY_OTP_PENDING"].includes(order.status);
  const canDispute = ["DELIVERED", "PICKED_UP", "IN_TRANSIT", "CANCELLED"].includes(order.status);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl animate-fade-up px-5 py-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Order</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink">{order.publicId}</h1>
            <p className="mt-1 text-sm text-ink/60">{order.pickup?.fullAddress} → {order.destination?.fullAddress}</p>
          </div>
          <span className="mt-1 shrink-0 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-ink/70">
            {STATUS_LABELS[order.status] ?? order.status.replaceAll("_", " ")}
          </span>
        </div>

        {/* Live map */}
        <div className="mt-6">
          <LiveTrackingMap
            orderId={order._id}
            pickup={{ lat: order.pickup.lat, lng: order.pickup.lng }}
            destination={{ lat: order.destination.lat, lng: order.destination.lng }}
          />
        </div>

        {/* OTP request buttons (customer-facing) */}
        {(canRequestPickupOtp || canRequestDeliveryOtp) && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              🔐 {canRequestPickupOtp ? "Show this OTP code to your rider at pickup" : "Show this OTP code to confirm delivery"}
            </p>
            {otpCode ? (
              <p className="mt-3 font-mono text-4xl font-bold tracking-[0.25em] text-amber-900">{otpCode}</p>
            ) : (
              <button
                onClick={() => requestOtp(canRequestPickupOtp ? "pickup" : "delivery")}
                disabled={otpSending}
                className="mt-3 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {otpSending ? "Generating…" : "Generate OTP code"}
              </button>
            )}
          </div>
        )}

        {/* Receipt link for delivered orders */}
        {order.status === "DELIVERED" && (
          <a
            href={`/orders/${params.id}/receipt`}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-route-green/20 bg-route-green/5 px-4 py-3 text-sm font-semibold text-route-green-dark transition hover:bg-route-green/10"
          >
            🧾 View & print receipt →
          </a>
        )}

        {/* Status history timeline */}
        <div className="mt-6">
          <h2 className="mb-3 font-display text-base font-bold text-ink">Status timeline</h2>
          <ol className="space-y-2 text-sm">
            {order.statusHistory?.map((h: any, i: number) => (
              <li
                key={i}
                className="animate-fade-up flex justify-between rounded-xl bg-black/[0.03] px-4 py-2.5"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="font-medium text-ink">{STATUS_LABELS[h.status] ?? h.status.replaceAll("_", " ")}</span>
                <span className="text-ink/40">{new Date(h.at ?? h.createdAt ?? Date.now()).toLocaleTimeString()}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Dispute section */}
        {canDispute && !disputeMsg && (
          <div className="mt-6">
            {!disputeOpen ? (
              <button
                onClick={() => setDisputeOpen(true)}
                className="text-sm font-semibold text-red-500 underline underline-offset-2 transition hover:text-red-700"
              >
                Report an issue with this order →
              </button>
            ) : (
              <form onSubmit={submitDispute} className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-red-800">File a dispute</h3>
                <select
                  className="w-full rounded-xl border border-red-200 bg-white p-3 text-sm"
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value)}
                >
                  <option value="DELIVERY_ISSUE">Delivery issue</option>
                  <option value="ITEM_DAMAGED">Item damaged</option>
                  <option value="ITEM_NOT_DELIVERED">Item not delivered</option>
                  <option value="WRONG_ITEM">Wrong item delivered</option>
                  <option value="OVERCHARGED">Overcharged</option>
                  <option value="RIDER_MISCONDUCT">Rider misconduct</option>
                  <option value="OTHER">Other</option>
                </select>
                <textarea
                  required
                  className="w-full rounded-xl border border-red-200 bg-white p-3 text-sm"
                  placeholder="Describe the issue in detail…"
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={disputeLoading}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {disputeLoading ? "Submitting…" : "Submit dispute"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisputeOpen(false)}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        {disputeMsg && (
          <p className="mt-4 rounded-xl bg-route-green/10 px-4 py-3 text-sm text-route-green-dark">{disputeMsg}</p>
        )}

        {/* Back link */}
        <a href="/orders" className="mt-8 block text-center text-sm font-semibold text-ink/40 underline hover:text-ink/70 transition-colors">
          ← All orders
        </a>
      </main>
      <Footer />
    </>
  );
}
