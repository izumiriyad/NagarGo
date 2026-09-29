"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function RiderProfilePage() {
  const router = useRouter();
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    address: "",
    vehicleDetails: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    profilePhotoUrl: "",
  });

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/rider/profile"); return; }
    api<any>("/riders/me")
      .then((r) => {
        setRider(r.rider);
        setForm({
          fullName: r.rider.fullName ?? "",
          address: r.rider.address ?? "",
          vehicleDetails: r.rider.vehicle?.details ?? "",
          emergencyContactName: r.rider.emergencyContact?.name ?? "",
          emergencyContactPhone: r.rider.emergencyContact?.phone ?? "",
          profilePhotoUrl: r.rider.profilePhotoUrl ?? "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API}/auth/signup-upload`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Upload failed");
      set("profilePhotoUrl", data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api<any>("/riders/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.fullName || undefined,
          address: form.address || undefined,
          vehicleDetails: form.vehicleDetails || undefined,
          emergencyContactName: form.emergencyContactName || undefined,
          emergencyContactPhone: form.emergencyContactPhone || undefined,
          profilePhotoUrl: form.profilePhotoUrl || undefined,
        }),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl animate-fade-up px-5 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-route-green">Rider Panel</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink">Your Profile</h1>
          </div>
          <a
            href="/rider/dashboard"
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
          >
            ← Dashboard
          </a>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        )}

        {rider && (
          <form onSubmit={save} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-5">
              {form.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.profilePhotoUrl}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-route-green/30"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-route-green/10 text-2xl">
                  🛵
                </div>
              )}
              <div>
                <p className="font-semibold text-ink">{rider.fullName}</p>
                <p className="text-xs text-ink/50">{rider.publicId} · {rider.status}</p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-route-green underline">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                  />
                  {uploadingPhoto ? "Uploading…" : "Change photo"}
                </label>
              </div>
            </div>

            {/* Personal details */}
            <div className="rounded-2xl border border-ink/10 bg-white p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-ink">Personal details</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50">Full name</label>
                <input
                  className="w-full rounded-xl border border-ink/15 p-3 text-sm focus:border-route-green focus:outline-none"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50">Address</label>
                <input
                  className="w-full rounded-xl border border-ink/15 p-3 text-sm focus:border-route-green focus:outline-none"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>
            </div>

            {/* Vehicle */}
            <div className="rounded-2xl border border-ink/10 bg-white p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-ink">Vehicle</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50">
                  Type: <span className="font-normal text-ink">{rider.vehicle?.type ?? "—"}</span>
                  <span className="ml-2 text-ink/30">(contact admin to change)</span>
                </label>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50">Vehicle details</label>
                <input
                  className="w-full rounded-xl border border-ink/15 p-3 text-sm focus:border-route-green focus:outline-none"
                  placeholder="e.g. Honda CB Shine, Red, 2020"
                  value={form.vehicleDetails}
                  onChange={(e) => set("vehicleDetails", e.target.value)}
                />
              </div>
            </div>

            {/* Emergency contact */}
            <div className="rounded-2xl border border-ink/10 bg-white p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-ink">Emergency contact</h2>
              <p className="text-xs text-ink/50">Only used if we're unable to reach you.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/50">Name</label>
                  <input
                    className="w-full rounded-xl border border-ink/15 p-3 text-sm focus:border-route-green focus:outline-none"
                    value={form.emergencyContactName}
                    onChange={(e) => set("emergencyContactName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/50">Phone</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    className="w-full rounded-xl border border-ink/15 p-3 text-sm focus:border-route-green focus:outline-none"
                    placeholder="01XXXXXXXXX"
                    value={form.emergencyContactPhone}
                    onChange={(e) => set("emergencyContactPhone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Read-only info */}
            <div className="rounded-2xl border border-ink/10 bg-white p-5 text-sm">
              <h2 className="mb-3 font-display text-base font-bold text-ink">Account info</h2>
              <dl className="space-y-2 text-ink/70">
                <div className="flex justify-between">
                  <dt className="text-ink/40">Phone</dt>
                  <dd className="font-semibold">{rider.phone}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/40">Trust score</dt>
                  <dd className="font-semibold">{rider.trustScore ?? "—"} / 100</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/40">Rating</dt>
                  <dd className="font-semibold">{rider.rating ? `${rider.rating} ⭐` : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/40">Completed</dt>
                  <dd className="font-semibold">{rider.completedDeliveries ?? 0} deliveries</dd>
                </div>
              </dl>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="animate-fade-up rounded-xl bg-route-green/10 px-4 py-3 text-sm font-semibold text-route-green-dark">
                ✓ Profile updated successfully
              </p>
            )}

            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="w-full rounded-xl bg-route-green py-3.5 font-semibold text-white transition hover:bg-route-green-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-sm font-semibold text-red-500 underline underline-offset-2 hover:text-red-700 transition"
            >
              Contact admin to close account
            </button>
          </form>
        )}

        <ConfirmModal
          open={showDeleteConfirm}
          title="Close your rider account?"
          body="To close your account, please contact our support team. Any pending earnings will be settled first."
          confirmLabel="Contact support"
          cancelLabel="Keep account"
          destructive
          onConfirm={() => { router.push("/contact"); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </main>
      <Footer />
    </>
  );
}
