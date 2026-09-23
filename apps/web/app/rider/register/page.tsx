"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/LocaleProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const VEHICLE_TYPES = [
  { value: "BICYCLE", label: "🚲 Bicycle" },
  { value: "MOTORCYCLE", label: "🏍️ Motorcycle" },
  { value: "THREE_WHEELER", label: "🛺 Three-wheeler / CNG" },
  { value: "OTHER", label: "🚗 Other" },
];

export default function Register() {
  const { t } = useI18n();
  const [done, setDone] = useState<any>();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState<any>({ vehicleType: "MOTORCYCLE", agreementAccepted: true });
  const set = (k: string, v: any) => setF((prev: any) => ({ ...prev, [k]: v }));

  async function uploadNid(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API}/riders/onboarding-upload`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Upload failed.");
      set("nidDocumentUrl", data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nidDocumentUrl) { setError("Please upload your NID document first."); return; }
    setSubmitting(true);
    setError("");
    try {
      setDone(await api<any>("/riders/register", { method: "POST", body: JSON.stringify(f) }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const fields: [string, string, boolean, string][] = [
    ["fullName", t("rider.register.fullName"), true, "text"],
    ["phone", t("rider.register.phone"), true, "tel"],
    ["nidNumber", t("rider.register.nidNumber"), true, "text"],
    ["address", t("rider.register.address"), true, "text"],
    ["emergencyName", t("rider.register.emergencyName"), false, "text"],
    ["emergencyPhone", t("rider.register.emergencyPhone"), false, "tel"],
    ["vehicleDetails", t("rider.register.vehicleDetails"), false, "text"],
    ["bkashNumber", t("rider.register.bkashNumber"), true, "tel"],
    ["accountHolderName", t("rider.register.accountHolder"), true, "text"],
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl animate-fade-up px-5 py-12">
        <div className="mb-8">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">Join our team</div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{t("rider.register.title")}</h1>
          <p className="mt-3 text-ink/60">{t("rider.register.subtitle")}</p>
        </div>

        {done ? (
          <div className="rounded-3xl border border-route-green/20 bg-route-green/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-route-green/10 text-3xl">
              🏍️
            </div>
            <h2 className="font-display text-2xl font-bold text-route-green-dark">{t("rider.register.received")}</h2>
            <p className="mt-3 text-ink/60">
              We&apos;ll review your application within 24–48 hours and notify you via WhatsApp and the app.
            </p>
            <div className="mt-6 rounded-2xl bg-white p-5">
              <div className="flex justify-between text-sm">
                <span className="text-ink/50">{t("rider.register.appId")}</span>
                <b className="font-mono">{done.rider?.publicId}</b>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-ink/50">{t("rider.register.status")}</span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {done.rider?.status}
                </span>
              </div>
            </div>
            <a
              href="/rider/dashboard"
              className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              Go to rider dashboard →
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {/* Personal details */}
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-display text-base font-bold text-ink">Personal details</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.slice(0, 4).map(([k, l, required, type]) => (
                  <input
                    key={k}
                    required={required}
                    type={type}
                    className="rounded-xl border border-ink/15 p-3 text-sm"
                    placeholder={l}
                    value={f[k] ?? ""}
                    onChange={(e) => set(k, e.target.value)}
                  />
                ))}
              </div>
            </div>

            {/* Emergency contact */}
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-display text-base font-bold text-ink">Emergency contact</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.slice(4, 6).map(([k, l, required, type]) => (
                  <input
                    key={k}
                    required={required}
                    type={type}
                    className="rounded-xl border border-ink/15 p-3 text-sm"
                    placeholder={l}
                    value={f[k] ?? ""}
                    onChange={(e) => set(k, e.target.value)}
                  />
                ))}
              </div>
            </div>

            {/* Vehicle */}
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-display text-base font-bold text-ink">Vehicle</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="rounded-xl border border-ink/15 p-3 text-sm"
                  value={f.vehicleType}
                  onChange={(e) => set("vehicleType", e.target.value)}
                >
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
                <input
                  className="rounded-xl border border-ink/15 p-3 text-sm"
                  placeholder={t("rider.register.vehicleDetails")}
                  value={f.vehicleDetails ?? ""}
                  onChange={(e) => set("vehicleDetails", e.target.value)}
                />
              </div>
            </div>

            {/* Payout */}
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-display text-base font-bold text-ink">Payout (bKash)</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.slice(7).map(([k, l, required, type]) => (
                  <input
                    key={k}
                    required={required}
                    type={type}
                    className="rounded-xl border border-ink/15 p-3 text-sm"
                    placeholder={l}
                    value={f[k] ?? ""}
                    onChange={(e) => set(k, e.target.value)}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/40">Your 80% earnings will be paid to this bKash account weekly.</p>
            </div>

            {/* NID Upload */}
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-display text-base font-bold text-ink">Identity verification</h2>
              <label className="mb-2 block text-sm text-ink/60">{t("rider.register.nidDoc")}</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => e.target.files?.[0] && uploadNid(e.target.files[0])}
                className="w-full rounded-xl border border-ink/15 p-3 text-sm"
              />
              {uploading && <p className="mt-2 text-xs text-ink/50">{t("rider.register.uploading")}</p>}
              {f.nidDocumentUrl && !uploading && (
                <p className="mt-2 text-xs text-route-green-dark">
                  ✓ Uploaded —{" "}
                  <a href={f.nidDocumentUrl} target="_blank" rel="noreferrer" className="underline">
                    preview
                  </a>
                </p>
              )}
            </div>

            {/* Agreement */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-4">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={f.agreementAccepted}
                onChange={(e) => set("agreementAccepted", e.target.checked)}
              />
              <span className="text-sm text-ink/60">
                I agree to NagarGo&apos;s{" "}
                <a href="/legal/terms" className="font-semibold text-route-green underline" target="_blank" rel="noreferrer">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/legal/privacy" className="font-semibold text-route-green underline" target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>
                . I confirm that all information provided is accurate.
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-route-green py-3.5 font-semibold text-white transition hover:bg-route-green-dark disabled:opacity-50"
              disabled={uploading || submitting || !f.agreementAccepted}
            >
              {submitting ? "Submitting application…" : t("rider.register.submit")}
            </button>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
