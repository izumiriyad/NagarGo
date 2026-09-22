"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useI18n } from "@/i18n/LocaleProvider";
import { NotificationBell } from "@/components/NotificationBell";

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
  const [locationReady, setLocationReady] = useState(false);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState("");
  const [telegramConnected, setTelegramConnected] = useState(false);

  async function load() {
    try {
      const [a, b] = await Promise.all([api<any>("/riders/me"), api<any>("/riders/orders")]);
      setProfile(a.rider); setOnline(a.rider.isOnline); setOrders(b.orders);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => {
    load();
    api<any>("/riders/telegram/connect").then((r) => { setTelegramUrl(r.connectUrl); setTelegramConnected(Boolean(r.connected)); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationPrompt(true); return; }
    const socket = getSocket();
    const push = async (pos: GeolocationPosition) => {
      setLocationReady(true); setLocationPrompt(false);
      const payload = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      try { await api<any>("/riders/location", { method: "POST", body: JSON.stringify(payload) }); } catch {}
      if (socket) {
        orders.filter((o) => ["RIDER_ASSIGNED","RIDER_ACCEPTED","RIDER_ARRIVING","RIDER_AT_PICKUP","PICKUP_OTP_PENDING","PICKED_UP","IN_TRANSIT","RIDER_AT_DESTINATION","DELIVERY_OTP_PENDING"].includes(o.status)).forEach((o) => socket.emit("rider:location", { orderId: o._id, ...payload }));
      }
    };
    const fail = () => { setLocationReady(false); setLocationPrompt(true); };
    const check = () => navigator.geolocation.getCurrentPosition(push, fail, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
    check();
    const watch = navigator.geolocation.watchPosition(push, fail, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
    const reminder = window.setInterval(check, 8000);
    return () => { navigator.geolocation.clearWatch(watch); window.clearInterval(reminder); };
  }, [orders]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNotification = (n: any) => {
      if (n.type === "ORDER_ASSIGNED") { setToast(t("rider.dashboard.newAssignment")); load(); setTimeout(() => setToast(""), 4000); }
    };
    socket.on("notification:new", onNotification);
    return () => { socket.off("notification:new", onNotification); };
  }, [t]);

  async function connectTelegram() {
    try { const r = await api<any>("/riders/telegram/connect"); setTelegramUrl(r.connectUrl); window.open(r.connectUrl, "_blank", "noopener,noreferrer"); } catch (e:any) { setError(e.message); }
  }

  async function toggle() {
    if (!online && !locationReady) { setLocationPrompt(true); return; }
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
        <div className="flex flex-wrap items-center gap-3">
          <NotificationBell />
          <a
            href="/rider/earnings"
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition-colors"
          >
            💰 Earnings
          </a>
          <button onClick={connectTelegram} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold">{telegramConnected ? "Telegram Connected ✓" : "Connect Telegram"}</button>
          <button onClick={toggle} className={`rounded-full px-5 py-3 font-semibold ${online ? "bg-route-green text-white" : "border border-ink/15"}`}>
            {online ? t("rider.dashboard.online") : t("rider.dashboard.goOnline")}
          </button>
        </div>
      </div>
      {error && <p className="mt-5 text-red-600">{error}</p>}
      {locationPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-md animate-fade-up rounded-3xl bg-white p-7 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-route-green/10 text-2xl">📍</div>
            <h2 className="mt-4 text-center font-display text-2xl font-bold">Turn On Your Live Location</h2>
            <p className="mt-2 text-center text-sm text-ink/60">NagarGo needs your live location to receive and complete delivery orders. Please allow Location permission and keep GPS on.</p>
            <button onClick={() => navigator.geolocation?.getCurrentPosition(() => setLocationPrompt(false), () => setLocationPrompt(true), { enableHighAccuracy: true })} className="mt-5 w-full rounded-xl bg-route-green px-5 py-3 font-bold text-white">Turn On Live Location</button>
          </div>
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
            <div className="mt-4 grid gap-2 rounded-2xl bg-route-green/5 p-4 sm:grid-cols-3">
              <div><p className="text-xs text-ink/50">Customer Pays</p><p className="text-xl font-bold">৳{o.pricing?.total ?? "—"}</p></div>
              <div><p className="text-xs text-ink/50">Your Earnings</p><p className="text-xl font-bold text-route-green-dark">৳{o.pricing?.riderEarnings ?? "—"}</p></div>
              <div><p className="text-xs text-ink/50">Distance / ETA</p><p className="text-sm font-bold">{o.pricing?.distanceKm ?? "—"} km · {o.pricing?.estimatedMinutes ?? "—"} min</p></div>
            </div>

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
