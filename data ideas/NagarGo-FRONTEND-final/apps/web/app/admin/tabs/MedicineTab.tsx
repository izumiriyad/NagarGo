"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge, AdminButton, Table } from "@/components/admin/AdminUI";

export function MedicineTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() { const r = await api<any>("/admin/medicine-orders"); setOrders(r.orders); }
  useEffect(() => { load(); }, []);

  async function decide(id: string, decision: "APPROVE" | "REJECT") {
    setBusyId(id);
    try {
      const note = decision === "REJECT" ? prompt("Review note (optional)") ?? undefined : undefined;
      await api<any>(`/admin/medicine-orders/${id}/review`, { method: "POST", body: JSON.stringify({ decision, note }) });
      await load();
    } finally { setBusyId(null); }
  }

  return (
    <Table
      columns={["Order", "Pharmacy", "Prescription", "Total", "Status", "Actions"]}
      rows={orders.map((o) => [
        <span key="id" className="font-semibold">{o.publicId}</span>,
        o.pickup?.pharmacyName,
        o.prescriptionUrl ? <a key="p" href={o.prescriptionUrl} target="_blank" rel="noreferrer" className="text-route-green underline">View</a> : <span key="p" className="text-ink/30">None</span>,
        `৳${o.pricing?.total ?? "-"}`,
        <StatusBadge key="s" status={o.status} />,
        o.status === "SUBMITTED" || o.status === "UNDER_REVIEW" ? (
          <div key="a" className="flex gap-2">
            <AdminButton tone="primary" disabled={busyId === o._id} onClick={() => decide(o._id, "APPROVE")}>Approve</AdminButton>
            <AdminButton tone="danger" disabled={busyId === o._id} onClick={() => decide(o._id, "REJECT")}>Reject</AdminButton>
          </div>
        ) : <span key="a" className="text-ink/30">—</span>,
      ])}
    />
  );
}
