"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminButton, Table } from "@/components/admin/AdminUI";

export function ContentTab() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ locale: "en", published: true });
  const [msg, setMsg] = useState("");

  async function load() { const r = await api<any>("/admin/content"); setItems(r.content); }
  useEffect(() => { load(); }, []);

  async function save() {
    try { await api<any>("/admin/content", { method: "PUT", body: JSON.stringify(form) }); setMsg("Saved."); await load(); }
    catch (e: any) { setMsg(e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink/10 p-5">
        <h3 className="mb-3 font-semibold">Edit a content block</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded-lg border border-ink/15 p-2 text-sm" placeholder="Key (e.g. home.hero.title)" value={form.key ?? ""} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <select className="rounded-lg border border-ink/15 p-2 text-sm" value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}>
            <option value="en">English</option>
            <option value="bn">Bangla</option>
          </select>
          <input className="rounded-lg border border-ink/15 p-2 text-sm sm:col-span-2" placeholder="Title" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="rounded-lg border border-ink/15 p-2 text-sm sm:col-span-2" placeholder="Body" rows={3} value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <AdminButton tone="primary" onClick={save}>Save content</AdminButton>
          {msg && <span className="text-xs text-ink/50">{msg}</span>}
        </div>
      </div>
      <Table
        columns={["Key", "Locale", "Title", "Published"]}
        rows={items.map((c) => [c.key, c.locale, c.title ?? "—", c.published ? "Yes" : "No"])}
      />
    </div>
  );
}
