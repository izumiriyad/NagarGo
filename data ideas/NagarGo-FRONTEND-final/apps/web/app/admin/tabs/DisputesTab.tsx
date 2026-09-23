"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge, AdminButton, Table } from "@/components/admin/AdminUI";

export function DisputesTab() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() { const r = await api<any>("/admin/disputes"); setDisputes(r.disputes); }
  useEffect(() => { load(); }, []);

  async function resolve(id: string, decision: "RESOLVED_CUSTOMER" | "RESOLVED_RIDER" | "DISMISSED") {
    setBusyId(id);
    try {
      const note = prompt("Resolution note (shown to the customer)") ?? undefined;
      await api<any>(`/admin/disputes/${id}/resolve`, { method: "POST", body: JSON.stringify({ decision, note }) });
      await load();
    } finally { setBusyId(null); }
  }

  return (
    <Table
      columns={["Category", "Reason", "Status", "Actions"]}
      rows={disputes.map((d) => [
        d.category?.replaceAll("_", " "),
        <span key="r" className="text-ink/70">{d.reason}</span>,
        <StatusBadge key="s" status={d.status} />,
        d.status === "OPEN" || d.status === "UNDER_REVIEW" ? (
          <div key="a" className="flex flex-wrap gap-2">
            <AdminButton tone="primary" disabled={busyId === d._id} onClick={() => resolve(d._id, "RESOLVED_CUSTOMER")}>Side with customer</AdminButton>
            <AdminButton disabled={busyId === d._id} onClick={() => resolve(d._id, "RESOLVED_RIDER")}>Side with rider</AdminButton>
            <AdminButton tone="danger" disabled={busyId === d._id} onClick={() => resolve(d._id, "DISMISSED")}>Dismiss</AdminButton>
          </div>
        ) : <span key="a" className="text-ink/30">—</span>,
      ])}
    />
  );
}
