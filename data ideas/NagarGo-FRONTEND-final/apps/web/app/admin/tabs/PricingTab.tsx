"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminButton, Card } from "@/components/admin/AdminUI";

const FIELDS: [string, string][] = [
  ["cityId", "City ID"], ["baseFare", "Base fare (৳)"], ["perKmRate", "Per-km rate (৳)"],
  ["minimumFare", "Minimum fare (৳)"], ["serviceFee", "Service fee (৳)"], ["peakMultiplier", "Peak multiplier"],
  ["emergencyMultiplier", "Emergency multiplier"], ["riderCommissionPercent", "Rider commission %"], ["nagarGoCommissionPercent", "NagarGo commission %"],
];

export function PricingTab() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ isPeakActive: false });
  const [msg, setMsg] = useState("");

  async function load() { const r = await api<any>("/admin/pricing"); setConfigs(r.configs); }
  useEffect(() => { load(); }, []);

  async function save() {
    try {
      const body = { ...form };
      ["baseFare", "perKmRate", "minimumFare", "serviceFee", "peakMultiplier", "emergencyMultiplier", "riderCommissionPercent", "nagarGoCommissionPercent"].forEach((k) => { body[k] = Number(body[k] ?? 0); });
      await api<any>("/admin/pricing", { method: "PUT", body: JSON.stringify(body) });
      setMsg("Saved."); await load();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="mb-3 font-semibold">Update pricing for a city</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([k, l]) => (
            <input key={k} className="rounded-lg border border-ink/15 p-2 text-sm" placeholder={l} value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          ))}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={!!form.isPeakActive} onChange={(e) => setForm({ ...form, isPeakActive: e.target.checked })} /> Peak pricing active
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <AdminButton tone="primary" onClick={save}>Save pricing</AdminButton>
          {msg && <span className="text-xs text-ink/50">{msg}</span>}
        </div>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Existing configs</h3>
        <pre className="max-h-80 overflow-auto rounded-xl bg-[#111] p-4 text-xs text-white">{JSON.stringify(configs, null, 2)}</pre>
      </Card>
    </div>
  );
}
