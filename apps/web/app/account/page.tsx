"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/LocaleProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NotificationBell } from "@/components/NotificationBell";

const STATUS_BADGE: Record<string, string> = {
  DELIVERED: "bg-route-green/10 text-route-green-dark",
  CANCELLED: "bg-red-50 text-red-600",
  DISPUTED: "bg-amber-50 text-amber-700",
  IN_TRANSIT: "bg-blue-50 text-blue-700",
  SEARCHING_RIDER: "bg-yellow-50 text-yellow-700",
  RIDER_ASSIGNED: "bg-blue-50 text-blue-700",
};

function statusLabel(s: string) {
  return s.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function Account() {
  const { t } = useI18n();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState("");

  const [tab, setTab] = useState<"orders" | "profile" | "addresses" | "disputes">("orders");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", username: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [addrForm, setAddrForm] = useState({ label: "HOME", address: "" });
  const [addrLoading, setAddrLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/account"); return; }

    async function load() {
      try {
        setLoading(true);
        const [userRes, ordersRes, disputesRes, refRes] = await Promise.allSettled([
          api<any>("/auth/me"),
          api<any>("/orders?limit=20"),
          api<any>("/disputes"),
          api<any>("/referral"),
        ]);
        if (userRes.status === "fulfilled") {
          setUser(userRes.value.user);
          setEditForm({ name: userRes.value.user.name, username: userRes.value.user.username ?? "" });
          setAddresses(userRes.value.user.savedAddresses ?? []);
        }
        if (ordersRes.status === "fulfilled") setOrders(ordersRes.value.orders);
        if (disputesRes.status === "fulfilled") setDisputes(disputesRes.value.disputes);
        if (refRes.status === "fulfilled") setReferralCode(refRes.value.referralCode);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);
    try {
      const r = await api<any>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: editForm.name, username: editForm.username || undefined }),
      });
      setUser(r.user);
      setEditing(false);
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddrLoading(true);
    try {
      const r = await api<any>("/addresses", {
        method: "POST",
        body: JSON.stringify(addrForm),
      });
      setAddresses(r.addresses);
      setAddrForm({ label: "HOME", address: "" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddrLoading(false);
    }
  }

  async function deleteAddress(id: string) {
    try {
      const r = await api<any>(`/addresses/${id}`, { method: "DELETE" });
      setAddresses(r.addresses);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function signOut() {
    localStorage.removeItem("nagargo_access_token");
    router.replace("/login");
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-4xl px-5 py-12">
          <div className="skeleton mb-4 h-8 w-48 rounded-xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </main>
        <Footer />
      </>
    );
  }

  const tabs: [typeof tab, string][] = [
    ["orders", t("account.orders")],
    ["profile", t("account.profile")],
    ["addresses", t("account.addresses")],
    ["disputes", t("account.disputes")],
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl animate-fade-up px-5 py-12">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user?.profileImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImageUrl}
                alt={user.name}
                className="h-14 w-14 rounded-full border border-ink/10 object-cover"
              />
            )}
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">{user?.name}</h1>
              <p className="text-sm text-ink/50">@{user?.username ?? "—"} · {user?.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={signOut}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
            >
              {t("account.signOut")}
            </button>
          </div>
        </div>

        {/* Referral code card */}
        {referralCode && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-route-green/20 bg-route-green/5 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Referral code</p>
              <p className="mt-1 font-display text-xl font-bold tracking-widest text-route-green-dark">
                {referralCode}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(referralCode)}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              Copy
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {/* Tab bar */}
        <div className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-ink/10 bg-white p-1">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === k ? "bg-ink text-white" : "text-ink/60 hover:bg-black/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {tab === "orders" && (
          <div className="mt-6 space-y-3">
            {orders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
                {t("orders.empty")}
                <br />
                <a href="/book" className="mt-3 inline-block font-semibold text-route-green underline">
                  Book a delivery →
                </a>
              </div>
            )}
            {orders.map((o) => (
              <div
                key={o._id}
                className="animate-fade-up rounded-2xl border border-ink/10 bg-white p-5 transition hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-display text-base font-bold">{o.publicId}</span>
                    <p className="mt-1 text-xs text-ink/50">
                      {o.pickup?.fullAddress} → {o.destination?.fullAddress}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_BADGE[o.status] ?? "bg-black/5 text-ink/60"
                    }`}
                  >
                    {statusLabel(o.status)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="font-bold">৳{o.pricing?.total ?? "—"}</span>
                    <span className="ml-2 text-ink/50">· {o.pricing?.distanceKm} km</span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/orders/${o._id}/track`}
                      className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                    >
                      {t("orders.track")}
                    </a>
                    {o.status === "DELIVERED" && !o.ratedByCustomer && (
                      <a
                        href={`/orders/${o._id}/track`}
                        className="rounded-lg bg-route-green/10 px-3 py-1.5 text-xs font-semibold text-route-green-dark transition hover:bg-route-green/20"
                      >
                        {t("orders.rate")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {orders.length > 0 && (
              <a
                href="/orders"
                className="mt-2 block text-center text-sm font-semibold text-route-green underline"
              >
                View all orders →
              </a>
            )}
          </div>
        )}

        {/* Profile */}
        {tab === "profile" && (
          <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6">
            {!editing ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Name", user?.name],
                    ["Username", user?.username ? `@${user.username}` : "—"],
                    ["Phone", user?.phone],
                    ["Email", user?.email ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-black/[0.02] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</p>
                      <p className="mt-1 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-5 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-soft"
                >
                  {t("account.editProfile")}
                </button>
              </>
            ) : (
              <form onSubmit={saveProfile} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink/60">Name</label>
                  <input
                    required
                    className="w-full rounded-xl border border-ink/15 p-3"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink/60">Username</label>
                  <input
                    className="w-full rounded-xl border border-ink/15 p-3"
                    placeholder="letters, numbers, _ and . only"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  />
                </div>
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="rounded-xl bg-route-green px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {editLoading ? "Saving…" : t("account.saveChanges")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setEditError(""); }}
                    className="rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Saved addresses */}
        {tab === "addresses" && (
          <div className="mt-6 space-y-3">
            <form onSubmit={addAddress} className="flex flex-wrap gap-2">
              <select
                className="rounded-xl border border-ink/15 p-3 text-sm"
                value={addrForm.label}
                onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
              >
                <option>HOME</option>
                <option>WORK</option>
                <option>OTHER</option>
              </select>
              <input
                required
                className="min-w-0 flex-1 rounded-xl border border-ink/15 p-3 text-sm"
                placeholder="Address"
                value={addrForm.address}
                onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
              />
              <button
                type="submit"
                disabled={addrLoading}
                className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {addrLoading ? "Saving…" : t("account.addAddress")}
              </button>
            </form>

            {addresses.length === 0 && (
              <p className="rounded-xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink/50">
                No saved addresses yet.
              </p>
            )}
            {addresses.map((a: any) => (
              <div
                key={a._id}
                className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-3"
              >
                <div>
                  <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold">
                    {a.label}
                  </span>
                  <p className="mt-1 text-sm">{a.address}</p>
                </div>
                <button
                  onClick={() => deleteAddress(a._id)}
                  className="text-xs text-red-500 transition hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}

            {/* Link to full address management page */}
            <div className="pt-2 text-right">
              <button
                onClick={() => router.push("/account/addresses")}
                className="text-sm text-route-green hover:text-route-green-dark font-medium transition-colors"
              >
                Manage all addresses →
              </button>
            </div>
          </div>
        )}

        {/* Disputes */}
        {tab === "disputes" && (
          <div className="mt-6 space-y-3">
            {disputes.length === 0 && (
              <p className="rounded-xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink/50">
                No disputes filed.
              </p>
            )}
            {disputes.map((d: any) => (
              <div key={d._id} className="rounded-2xl border border-ink/10 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{d.category?.replaceAll("_", " ")}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      d.status?.includes("RESOLVED")
                        ? "bg-route-green/10 text-route-green-dark"
                        : d.status === "DISMISSED"
                        ? "bg-black/5 text-ink/50"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/70">{d.reason}</p>
                {d.resolutionNote && (
                  <p className="mt-2 rounded-lg bg-route-green/5 px-3 py-2 text-xs text-route-green-dark">
                    Resolution: {d.resolutionNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
