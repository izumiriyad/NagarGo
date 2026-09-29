"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminButton, Card } from "@/components/admin/AdminUI";

const FIELDS: [string, string, string][] = [
  ["cityId",                  "City ID",                      "text"],
  ["baseFare",                "Base fare (৳)",                "number"],
  ["perKmRate",               "Per-km rate (৳)",              "number"],
  ["minimumFare",             "Minimum fare (৳)",             "number"],
  ["serviceFee",              "Service fee (৳)",              "number"],
  ["peakMultiplier",          "Peak hour multiplier",         "number"],
  ["emergencyMultiplier",     "Emergency multiplier",         "number"],
  ["riderCommissionPercent",  "Rider commission %",           "number"],
  ["nagarGoCommissionPercent","NagarGo commission %",         "number"],
];

const NUMERIC_KEYS = FIELDS.filter(([, , t]) => t === "number").map(([k]) => k);

export function PricingTab() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ isPeakActive: false });
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  async function load() {
    try {
      const r = await api<any>("/admin/pricing");
      setConfigs(r.configs ?? []);
    } catch {/* keep stale */}
  }
  useEffect(() => { load(); }, []);

  function openEdit(cfg: any) {
    setEditTarget(cfg);
    setForm({ ...cfg });
    setMsg("");
  }

  function openNew() {
    setEditTarget(null);
    setForm({ isPeakActive: false });
    setMsg("");
  }

  async function save() {
    setLoading(true);
    setMsg("");
    try {
      const body = { ...form };
      NUMERIC_KEYS.forEach((k) => { body[k] = Number(body[k] ?? 0); });
      await api<any>("/admin/pricing", { method: "PUT", body: JSON.stringify(body) });
      setMsgType("ok");
      setMsg("✅ Pricing saved.");
      setEditTarget(null);
      await load();
    } catch (e: any) {
      setMsgType("err");
      setMsg(e.message ?? "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing configs */}
      {configs.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink">Active pricing configs</h3>
            <AdminButton tone="primary" onClick={openNew}>+ New config</AdminButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {configs.map((cfg) => (
              <div
                key={cfg._id ?? cfg.cityId}
                className="rounded-2xl border border-ink/10 bg-white p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-ink">{cfg.cityId}</span>
                  {cfg.isPeakActive && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      PEAK ON
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {[
                    ["Base fare", `৳${cfg.baseFare}`],
                    ["Per km", `৳${cfg.perKmRate}`],
                    ["Min fare", `৳${cfg.minimumFare}`],
                    ["Service fee", `৳${cfg.serviceFee}`],
                    ["Peak ×", `${cfg.peakMultiplier}×`],
                    ["Emergency ×", `${cfg.emergencyMultiplier}×`],
                    ["Rider cut", `${cfg.riderCommissionPercent}%`],
                    ["Platform cut", `${cfg.nagarGoCommissionPercent}%`],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="flex justify-between">
                      <dt className="text-ink/40">{l}</dt>
                      <dd className="font-semibold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={() => openEdit(cfg)}
                  className="mt-4 w-full rounded-lg border border-ink/15 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit / create form */}
      {(editTarget !== null || configs.length === 0) && (
        <Card>
          <h3 className="mb-4 font-semibold">
            {editTarget ? `Edit — ${editTarget.cityId}` : "Create new pricing config"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map(([k, l, t]) => (
              <div key={k}>
                <label className="mb-1 block text-xs text-ink/50">{l}</label>
                <input
                  type={t}
                  step={t === "number" ? "0.01" : undefined}
                  min={t === "number" ? "0" : undefined}
                  className="w-full rounded-lg border border-ink/15 p-2 text-sm"
                  placeholder={l}
                  value={form[k] ?? ""}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={!!form.isPeakActive}
                onChange={(e) => setForm({ ...form, isPeakActive: e.target.checked })}
              />
              <span>Peak pricing currently active</span>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <AdminButton tone="primary" onClick={save} disabled={loading}>
              {loading ? "Saving…" : editTarget ? "Update pricing" : "Create pricing"}
            </AdminButton>
            {editTarget && (
              <button
                onClick={() => { setEditTarget(null); setForm({ isPeakActive: false }); }}
                className="text-sm text-ink/40 hover:text-ink/70"
              >
                Cancel
              </button>
            )}
            {msg && (
              <span className={`text-xs ${msgType === "ok" ? "text-route-green-dark" : "text-red-600"}`}>
                {msg}
              </span>
            )}
          </div>
        </Card>
      )}

      {configs.length === 0 && !editTarget && (
        <div className="text-center py-12 text-ink/40 text-sm">
          No pricing configs yet.{" "}
          <button onClick={openNew} className="font-semibold text-route-green underline">
            Create one
          </button>
        </div>
      )}
    </div>
  );
}
