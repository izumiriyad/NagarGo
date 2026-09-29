"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useI18n } from "@/i18n/LocaleProvider";
import { NotificationBell } from "@/components/NotificationBell";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const NEXT_ADVANCE_LABEL: Record<string, string> = {
  RIDER_ASSIGNED: "Confirm en route",
  RIDER_ACCEPTED: "Arriving at pickup",
  RIDER_ARRIVING: "Arrived at pickup",
  PICKUP_OTP_PENDING: "Waiting for pickup OTP",
  PICKED_UP: "Start delivery",
  IN_TRANSIT: "Arrived at destination",
  RIDER_AT_DESTINATION: "Waiting for delivery OTP",
};

const STATUS_DOT: Record<string, string> = {
  RIDER_ASSIGNED: "bg-blue-500",
  RIDER_ACCEPTED: "bg-blue-500",
  PICKED_UP: "bg-amber-500",
  IN_TRANSIT: "bg-amber-500",
  DELIVERED: "bg-route-green",
  CANCELLED: "bg-red-500",
  DISPUTED: "bg-amber-600",
};

export default function RiderDashboard() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>();
  const [online, setOnline] = useState(false);
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [locationReady, setLocationReady] = useState(false);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "all">("active");

  async function load() {
    try {
      const [a, b, e] = await Promise.all([
        api<any>("/riders/me"),
        api<any>("/riders/orders"),
        api<any>("/riders/me/earnings").catch(() => null),
      ]);
      setProfile(a.rider);
      setOnline(a.rider.isOnline);
      setOrders(b.orders);
      // API returns { earnings: { today, thisWeek, thisMonth, total, ... } }
      if (e?.earnings) setEarnings(e.earnings);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    api<any>("/riders/telegram/connect")
      .then((r) => setTelegramConnected(Boolean(r.connected)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationPrompt(true); return; }
    const socket = getSocket();
    const push = async (pos: GeolocationPosition) => {
      setLocationReady(true); setLocationPrompt(false);
      const payload = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      try { await api<any>("/riders/location", { method: "POST", body: JSON.stringify(payload) }); } catch {}
      if (socket) {
        orders
          .filter((o) =>
            ["RIDER_ASSIGNED","RIDER_ACCEPTED","RIDER_ARRIVING","RIDER_AT_PICKUP",
             "PICKUP_OTP_PENDING","PICKED_UP","IN_TRANSIT","RIDER_AT_DESTINATION",
             "DELIVERY_OTP_PENDING"].includes(o.status)
          )
          .forEach((o) => socket.emit("rider:location", { orderId: o._id, ...payload }));
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
      if (n.type === "ORDER_ASSIGNED") {
        setToast(t("rider.dashboard.newAssignment"));
        load();
        setTimeout(() => setToast(""), 4000);
      }
    };
    socket.on("notification:new", onNotification);
    return () => { socket.off("notification:new", onNotification); };
  }, [t]);

  async function connectTelegram() {
    try {
      const r = await api<any>("/riders/telegram/connect");
      window.open(r.connectUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) { setError(err.message); }
  }

  async function toggle() {
    if (!online && !locationReady) { setLocationPrompt(true); return; }
    try {
      const r = await api<any>("/riders/online", { method: "POST", body: JSON.stringify({ online: !online }) });
      setOnline(r.isOnline);
    } catch (err: any) { setError(err.message); }
  }

  async function acceptOrder(orderId: string) {
    try { await api<any>(`/orders/${orderId}/advance`, { method: "POST" }); await load(); }
    catch (err: any) { setError(err.message); }
  }
  async function declineOrder(orderId: string) {
    try {
      await api<any>(`/orders/${orderId}/reject-assignment`, { method: "POST", body: JSON.stringify({ reason: "Rider declined." }) });
      await load();
    } catch (err: any) { setError(err.message); }
  }
  async function advance(orderId: string) {
    try { await api<any>(`/orders/${orderId}/advance`, { method: "POST" }); await load(); }
    catch (err: any) { setError(err.message); }
  }
  async function verifyOtp(orderId: string, stage: "pickup" | "delivery") {
    try {
      await api<any>(`/orders/${orderId}/otp/${stage}/verify`, {
        method: "POST",
        body: JSON.stringify({ code: otpCode[orderId] ?? "" }),
      });
      setOtpCode({ ...otpCode, [orderId]: "" });
      await load();
    } catch (err: any) { setError(err.message); }
  }

  const activeOrders = orders.filter((o) =>
    !["DELIVERED", "CANCELLED", "FAILED", "DISPUTED"].includes(o.status)
  );
  const historyOrders = orders.filter((o) =>
    ["DELIVERED", "CANCELLED", "FAILED", "DISPUTED"].includes(o.status)
  );
  const displayOrders = activeTab === "active" ? activeOrders : historyOrders;

  const cancelCount = orders.filter((o) => o.status === "CANCELLED").length;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Toast */}
        {toast && (
          <div className="animate-slide-in-right mb-4 rounded-xl bg-route-green/10 px-4 py-3 text-sm font-semibold text-route-green-dark">
            🔔 {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="avatar" className="h-12 w-12 rounded-full object-cover ring-2 ring-route-green/30" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-route-green/10 text-xl">
                🛵
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("rider.dashboard.title")}</h1>
              <p className="text-sm text-ink/60">{profile?.fullName} • <span className={profile?.status === "APPROVED" ? "text-route-green-dark font-semibold" : "text-amber-600"}>{profile?.status}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NotificationBell />
            <a href="/rider/earnings" className="tap-target rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition-colors">
              💰 Earnings
            </a>
            <a href="/rider/profile" className="tap-target rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition-colors">
              ✏️ Profile
            </a>
            <button
              onClick={connectTelegram}
              className="tap-target rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition-colors"
            >
              {telegramConnected ? "✓ Telegram" : "Connect Telegram"}
            </button>
            <button
              onClick={toggle}
              className={`tap-target rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                online
                  ? "bg-route-green text-white shadow-lg shadow-route-green/25 hover:bg-route-green-dark"
                  : "border border-ink/15 hover:bg-black/5"
              }`}
            >
              {online ? "🟢 " + t("rider.dashboard.online") : t("rider.dashboard.goOnline")}
            </button>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {/* Location permission modal */}
        {locationPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
            <div className="w-full max-w-md animate-fade-up rounded-3xl bg-white p-7 shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-route-green/10 text-2xl">📍</div>
              <h2 className="mt-4 text-center font-display text-2xl font-bold">Enable Live Location</h2>
              <p className="mt-2 text-center text-sm text-ink/60">
                NagarGo needs your GPS location to receive orders and show your position to customers.
              </p>
              <button
                onClick={() =>
                  navigator.geolocation?.getCurrentPosition(
                    () => setLocationPrompt(false),
                    () => setLocationPrompt(true),
                    { enableHighAccuracy: true }
                  )
                }
                className="mt-5 w-full rounded-xl bg-route-green px-5 py-3 font-bold text-white hover:bg-route-green-dark transition"
              >
                Enable Location
              </button>
              <button onClick={() => setLocationPrompt(false)} className="mt-3 w-full rounded-xl border border-ink/10 py-2.5 text-sm text-ink/50">
                Not now
              </button>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{t("rider.dashboard.trustScore")}</p>
            <p className="mt-2 text-3xl font-bold text-ink">{profile?.trustScore ?? "—"}</p>
            <p className="mt-1 text-xs text-ink/40">Out of 100</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{t("rider.dashboard.rating")}</p>
            <p className="mt-2 text-3xl font-bold text-ink">
              {profile?.rating ? `${profile.rating} ⭐` : "—"}
            </p>
            <p className="mt-1 text-xs text-ink/40">Customer rating</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{t("rider.dashboard.completed")}</p>
            <p className="mt-2 text-3xl font-bold text-route-green-dark">{profile?.completedDeliveries ?? "—"}</p>
            <p className="mt-1 text-xs text-ink/40">Total deliveries</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Today's Earnings</p>
            <p className="mt-2 text-3xl font-bold text-ink">
              ৳{earnings?.today ?? "—"}
            </p>
            <p className="mt-1 text-xs text-ink/40">
              {cancelCount > 0 ? `${cancelCount} cancelled` : "No cancellations"}
            </p>
          </div>
        </div>

        {/* Earnings summary strip */}
        {earnings && (
          <div className="mt-4 grid gap-3 rounded-2xl border border-ink/10 bg-gradient-to-r from-route-green/5 to-transparent p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-ink/50">This Week</p>
              <p className="text-xl font-bold">৳{earnings.thisWeek ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-ink/50">This Month</p>
              <p className="text-xl font-bold">৳{earnings.thisMonth ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-ink/50">All Time</p>
              <p className="text-xl font-bold">৳{earnings.total ?? "—"}</p>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="mt-10 flex items-center gap-1 rounded-2xl border border-ink/10 bg-white p-1 w-fit">
          <button
            onClick={() => setActiveTab("active")}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              activeTab === "active" ? "bg-ink text-white" : "text-ink/50 hover:text-ink"
            }`}
          >
            Active {activeOrders.length > 0 && `(${activeOrders.length})`}
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              activeTab === "all" ? "bg-ink text-white" : "text-ink/50 hover:text-ink"
            }`}
          >
            History {historyOrders.length > 0 && `(${historyOrders.length})`}
          </button>
        </div>

        {/* Orders list */}
        <h2 className="mt-6 font-display text-xl font-bold">{t("rider.dashboard.myDeliveries")}</h2>
        {displayOrders.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink/50">
            {activeTab === "active" ? "No active orders right now. Go online to receive assignments." : "No completed orders yet."}
          </p>
        )}
        <div className="mt-4 space-y-3">
          {displayOrders.map((o) => (
            <div key={o._id} className="animate-fade-up rounded-2xl border border-ink/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[o.status] ?? "bg-ink/20"}`} />
                  <b className="font-display">{o.publicId}</b>
                </div>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold">
                  {o.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink/60 line-clamp-1">
                {o.pickup?.fullAddress} → {o.destination?.fullAddress}
              </p>

              {/* Pricing */}
              <div className="mt-4 grid gap-2 rounded-2xl bg-route-green/5 p-4 sm:grid-cols-3">
                <div><p className="text-xs text-ink/50">Customer Pays</p><p className="text-xl font-bold">৳{o.pricing?.total ?? "—"}</p></div>
                <div><p className="text-xs text-ink/50">Your Earnings</p><p className="text-xl font-bold text-route-green-dark">৳{o.pricing?.riderEarnings ?? "—"}</p></div>
                <div>
                  <p className="text-xs text-ink/50">Distance / ETA</p>
                  <p className="text-sm font-bold">{o.pricing?.distanceKm ?? "—"} km · {o.pricing?.estimatedMinutes ?? "—"} min</p>
                </div>
              </div>

              {/* Map link when in transit */}
              {["PICKED_UP","IN_TRANSIT"].includes(o.status) && o.destination?.lat && o.destination?.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${o.destination.lat},${o.destination.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  🗺️ Navigate to destination
                </a>
              )}

              {/* Accept / Decline */}
              {o.status === "RIDER_ASSIGNED" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => acceptOrder(o._id)} className="tap-target rounded-lg bg-route-green px-4 py-2 text-sm font-semibold text-white hover:bg-route-green-dark transition">
                    {t("rider.dashboard.accept")}
                  </button>
                  <button onClick={() => declineOrder(o._id)} className="tap-target rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition">
                    {t("rider.dashboard.decline")}
                  </button>
                </div>
              )}

              {/* OTP verification */}
              {["PICKUP_OTP_PENDING", "DELIVERY_OTP_PENDING"].includes(o.status) && (
                <div className="mt-3 flex gap-2">
                  <input
                    className="w-32 rounded-lg border border-ink/15 p-2 text-sm tracking-widest focus:border-route-green focus:outline-none"
                    placeholder="OTP"
                    value={otpCode[o._id] ?? ""}
                    onChange={(e) => setOtpCode({ ...otpCode, [o._id]: e.target.value })}
                  />
                  <button
                    onClick={() => verifyOtp(o._id, o.status === "PICKUP_OTP_PENDING" ? "pickup" : "delivery")}
                    className="tap-target rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/80 transition"
                  >
                    Verify {o.status === "PICKUP_OTP_PENDING" ? "pickup" : "delivery"} OTP
                  </button>
                </div>
              )}

              {/* Advance button */}
              {NEXT_ADVANCE_LABEL[o.status] && !["PICKUP_OTP_PENDING","DELIVERY_OTP_PENDING","RIDER_ASSIGNED"].includes(o.status) && (
                <div className="mt-3">
                  <button
                    onClick={() => advance(o._id)}
                    className="tap-target rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition"
                  >
                    {NEXT_ADVANCE_LABEL[o.status]} →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
