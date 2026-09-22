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
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        </form>
      )}
    </main>
  );
}
