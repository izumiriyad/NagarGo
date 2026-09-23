"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminButton, Table } from "@/components/admin/AdminUI";

export function FlagsTab() {
  const [flags, setFlags] = useState<any[]>([]);
  const [newKey, setNewKey] = useState("");

  async function load() { const r = await api<any>("/admin/flags"); setFlags(r.flags); }
  useEffect(() => { load(); }, []);

  async function toggle(key: string, enabled: boolean) {
    await api<any>("/admin/flags", { method: "PUT", body: JSON.stringify({ key, enabled: !enabled }) });
    await load();
  }
  async function addFlag() {
    if (!newKey.trim()) return;
    await api<any>("/admin/flags", { method: "PUT", body: JSON.stringify({ key: newKey.trim(), enabled: false }) });
    setNewKey(""); await load();
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input className="flex-1 rounded-lg border border-ink/15 p-2 text-sm" placeholder="New flag key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
        <AdminButton tone="primary" onClick={addFlag}>Add flag</AdminButton>
      </div>
      <Table
        columns={["Key", "Description", "Enabled", "Toggle"]}
        rows={flags.map((f) => [
          f.key, f.description ?? "—", f.enabled ? "Yes" : "No",
          <AdminButton key="t" tone={f.enabled ? "danger" : "primary"} onClick={() => toggle(f.key, f.enabled)}>{f.enabled ? "Disable" : "Enable"}</AdminButton>,
        ])}
      />
    </div>
  );
}
