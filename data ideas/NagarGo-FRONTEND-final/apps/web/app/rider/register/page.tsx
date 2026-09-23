"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/LocaleProvider";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function Register() {
  const { t } = useI18n();
  const [done, setDone] = useState<any>();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState<any>({ vehicleType: "MOTORCYCLE", agreementAccepted: true });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });

  async function uploadNid(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      let res: Response;
      try {
        res = await fetch(`${API}/riders/onboarding-upload`, { method: "POST", body });
      } catch {
        throw new Error("NID upload could not reach the NagarGo server. Check your internet connection and try again.");
      }
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 413) throw new Error("The NID file is larger than the 8 MB limit. Choose a smaller image or PDF.");
        throw new Error(data.message ?? `NID upload failed with HTTP ${res.status}. Check the file type and try again.`);
      }
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
    if (!f.address || f.address.trim().length < 5) { setError("Address must be at least 5 characters. Please enter your full address or area."); return; }
    try {
      setDone(await api<any>("/riders/register", { method: "POST", body: JSON.stringify(f) }));
    } catch (e: any) { setError(e.message); }
  }

  const fields: [string, string, boolean][] = [
    ["fullName", t("rider.register.fullName"), true],
    ["phone", t("rider.register.phone"), true],
    ["nidNumber", t("rider.register.nidNumber"), true],
    ["address", t("rider.register.address"), true],
    ["emergencyName", t("rider.register.emergencyName"), false],
    ["emergencyPhone", t("rider.register.emergencyPhone"), false],
    ["vehicleDetails", t("rider.register.vehicleDetails"), false],
    ["bkashNumber", t("rider.register.bkashNumber"), true],
    ["accountHolderName", t("rider.register.accountHolder"), true],
  ];

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold">{t("rider.register.title")}</h1>
      <p className="mt-2 text-ink/60">{t("rider.register.subtitle")}</p>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
          <p className="text-base font-bold">We couldn&rsquo;t complete that request</p>
          <p className="mt-1 text-sm leading-6">{error}</p>
          <p className="mt-2 text-xs font-semibold text-red-700">What to do: check the form values, confirm the NID upload is complete, then try again. If it still fails, contact NagarGo support on WhatsApp at +8801683772714 and include this message.</p>
        </div>
      )}

      {done ? (
        <div className="mt-8 rounded-2xl border border-ink/10 p-6">
          <h2 className="font-bold">{t("rider.register.received")}</h2>
          <p className="mt-2">{t("rider.register.appId")}: {done.rider.publicId}. {t("rider.register.status")}: {done.rider.status}.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
          {fields.map(([k, l, required]) => (
            <input
              key={k}
              required={required}
              className="rounded-xl border border-ink/15 p-3"
              placeholder={l}
              value={f[k] ?? ""}
              onChange={(e) => set(k, e.target.value)}
            />
          ))}

          <select className="rounded-xl border border-ink/15 p-3" value={f.vehicleType} onChange={(e) => set("vehicleType", e.target.value)}>
            <option>BICYCLE</option>
            <option>MOTORCYCLE</option>
            <option>OTHER</option>
          </select>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-ink/60">{t("rider.register.nidDoc")}</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => e.target.files?.[0] && uploadNid(e.target.files[0])}
              className="w-full rounded-xl border border-ink/15 p-3 text-sm"
            />
            {uploading && <p className="mt-1 text-xs text-ink/50">{t("rider.register.uploading")}</p>}
            {f.nidDocumentUrl && !uploading && (
              <p className="mt-1 text-xs text-route-green-dark">✓ Uploaded — <a href={f.nidDocumentUrl} target="_blank" rel="noreferrer" className="underline">preview</a></p>
            )}
          </div>

          <button className="rounded-xl bg-route-green px-5 py-3 font-semibold text-white sm:col-span-2" disabled={uploading}>
            {t("rider.register.submit")}
          </button>
        </form>
      )}
    </main>
  );
}
