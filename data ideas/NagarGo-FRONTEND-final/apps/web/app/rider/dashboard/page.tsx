"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useI18n } from "@/i18n/LocaleProvider";
import { NotificationBell } from "@/components/NotificationBell";
import { LiveTrackingMap } from "@/components/maps/LiveTrackingMap";

const NEXT_ADVANCE_LABEL: Record<string, string> = {
  RIDER_ASSIGNED: "Confirm en route",
  RIDER_ACCEPTED: "Arriving at pickup",
  RIDER_ARRIVING: "Arrived at pickup",
  PICKUP_OTP_PENDING: "Waiting for pickup OTP",
  PICKED_UP: "Start delivery",
  IN_TRANSIT: "Arrived at destination",
  RIDER_AT_DESTINATION: "Waiting for delivery OTP",
};

export default function RiderDashboard() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  async function load() {
    try {
      const [a, b] = await Promise.all([api<any>("/riders/me"), api<any>("/riders/orders")]);
      setProfile(a.rider); setOnline(a.rider.isOnline); setOrders(b.orders);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNotification = (n: any) => {
      if (n.type === "ORDER_ASSIGNED") { setToast(t("rider.dashboard.newAssignment")); load(); setTimeout(() => setToast(""), 4000); }
    };
    socket.on("notification:new", onNotification);
    return () => { socket.off("notification:new", onNotification); };
  }, [t]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !navigator.geolocation || !online) return;
    const activeOrders = orders.filter((o) => o.riderId && ["RIDER_ASSIGNED", "RIDER_ACCEPTED", "RIDER_ARRIVING", "RIDER_AT_PICKUP", "PICKUP_OTP_PENDING", "PICKED_UP", "IN_TRANSIT", "RIDER_AT_DESTINATION", "DELIVERY_OTP_PENDING"].includes(o.status));
    activeOrders.forEach((o) => socket.emit("order:join", o._id));
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => activeOrders.forEach((o) => socket.emit("rider:location", { orderId: o._id, lat: coords.latitude, lng: coords.longitude })),
      () => setError("Location access is needed while you are online to share live delivery progress."),
      { enableHighAccuracy: true, maximumAge: 8_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [online, orders]);

  async function toggle() {
    try {
      const r = await api<any>("/riders/online", { method: "POST", body: JSON.stringify({ online: !online }) });
      setOnline(r.isOnline);
    } catch (e: any) { setError(e.message); }
  }

  async function acceptOrder(orderId: string) {
    try { await api<any>(`/orders/${orderId}/advance`, { method: "POST" }); await load(); }
    catch (e: any) { setError(e.message); }
  }
  async function declineOrder(orderId: string) {
    try { await api<any>(`/orders/${orderId}/reject-assignment`, { method: "POST", body: JSON.stringify({ reason: "Rider declined." }) }); await load(); }
    catch (e: any) { setError(e.message); }
  }
  async function advance(orderId: string) {
    try { await api<any>(`/orders/${orderId}/advance`, { method: "POST" }); await load(); }
    catch (e: any) { setError(e.message); }
  }
  async function verifyOtp(orderId: string, stage: "pickup" | "delivery") {
    try {
      await api<any>(`/orders/${orderId}/otp/${stage}/verify`, { method: "POST", body: JSON.stringify({ code: otpCode[orderId] ?? "" }) });
      setOtpCode({ ...otpCode, [orderId]: "" });
      await load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      {toast && <div className="mb-4 rounded-xl bg-route-green/10 px-4 py-3 text-sm font-semibold text-route-green-dark">{toast}</div>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("rider.dashboard.title")}</h1>
          <p className="text-ink/60">{profile?.fullName} • {profile?.status}</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button onClick={toggle} className={`rounded-full px-5 py-3 font-semibold ${online ? "bg-route-green text-white" : "border border-ink/15"}`}>
            {online ? t("rider.dashboard.online") : t("rider.dashboard.goOnline")}
          </button>
        </div>
      </div>
      {error && <p className="mt-5 text-red-600">{error}</p>}
      {profile?.rejectionReason && (profile.status === "REJECTED" || profile.status === "SUSPENDED") && (
        <div className="mt-5 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-bold">Your rider application is {profile.status.toLowerCase()}.</p>
          <p className="mt-1 text-sm">Admin reason: {profile.rejectionReason}</p>
          <p className="mt-2 text-xs font-semibold">Contact NagarGo support on WhatsApp at +8801683772714 if you need clarification.</p>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 p-5"><p className="text-xs text-ink/50">{t("rider.dashboard.trustScore")}</p><p className="mt-2 text-3xl font-bold">{profile?.trustScore ?? "—"}</p></div>
        <div className="rounded-2xl border border-ink/10 p-5"><p className="text-xs text-ink/50">{t("rider.dashboard.rating")}</p><p className="mt-2 text-3xl font-bold">{profile?.rating ?? "—"}</p></div>
        <div className="rounded-2xl border border-ink/10 p-5"><p className="text-xs text-ink/50">{t("rider.dashboard.completed")}</p><p className="mt-2 text-3xl font-bold">{profile?.completedDeliveries ?? "—"}</p></div>
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">{t("rider.dashboard.myDeliveries")}</h2>
      {orders.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink/50">{t("rider.dashboard.noOrders")}</p>}
      <div className="mt-4 space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="rounded-2xl border border-ink/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b>{o.publicId}</b>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold">{o.status.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-2 text-sm text-ink/60">{o.pickup?.fullAddress} → {o.destination?.fullAddress}</p>
            {o.pricing && (
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-route-green/5 p-3 text-xs">
                <div><p className="text-ink/50">Distance</p><b>{o.pricing.distanceKm} km</b></div>
                <div><p className="text-ink/50">Customer pays</p><b>৳{o.pricing.total}</b></div>
                <div><p className="text-ink/50">Your earnings</p><b className="text-route-green-dark">৳{o.pricing.riderEarnings}</b></div>
              </div>
            )}

            {o.pickup?.lat != null && o.destination?.lat != null && ["RIDER_ASSIGNED", "RIDER_ACCEPTED", "RIDER_ARRIVING", "RIDER_AT_PICKUP", "PICKUP_OTP_PENDING", "PICKED_UP", "IN_TRANSIT", "RIDER_AT_DESTINATION", "DELIVERY_OTP_PENDING"].includes(o.status) && (
              <div className="mt-4"><LiveTrackingMap orderId={o._id} pickup={{ lat: o.pickup.lat, lng: o.pickup.lng }} destination={{ lat: o.destination.lat, lng: o.destination.lng }} /></div>
            )}

            {o.status === "RIDER_ASSIGNED" && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => acceptOrder(o._id)} className="rounded-lg bg-route-green px-4 py-2 text-sm font-semibold text-white">{t("rider.dashboard.accept")}</button>
                <button onClick={() => declineOrder(o._id)} className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold">{t("rider.dashboard.decline")}</button>
              </div>
            )}

            {["PICKUP_OTP_PENDING", "DELIVERY_OTP_PENDING"].includes(o.status) && (
              <div className="mt-3 flex gap-2">
                <input
                  className="w-32 rounded-lg border border-ink/15 p-2 text-sm"
                  placeholder="OTP code"
                  value={otpCode[o._id] ?? ""}
                  onChange={(e) => setOtpCode({ ...otpCode, [o._id]: e.target.value })}
                />
                <button
                  onClick={() => verifyOtp(o._id, o.status === "PICKUP_OTP_PENDING" ? "pickup" : "delivery")}
                  className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
                >
                  Verify {o.status === "PICKUP_OTP_PENDING" ? "pickup" : "delivery"} OTP
                </button>
              </div>
            )}

            {NEXT_ADVANCE_LABEL[o.status] && !["PICKUP_OTP_PENDING", "DELIVERY_OTP_PENDING", "RIDER_ASSIGNED"].includes(o.status) && (
              <div className="mt-3">
                <button onClick={() => advance(o._id)} className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold">
                  {NEXT_ADVANCE_LABEL[o.status]}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
