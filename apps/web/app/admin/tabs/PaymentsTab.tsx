"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge, AdminButton, Table } from "@/components/admin/AdminUI";

export function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() { const r = await api<any>("/admin/payments"); setPayments(r.payments); }
  useEffect(() => { load(); }, []);

  async function decide(id: string, decision: "VERIFY" | "REJECT") {
    setBusyId(id);
    try {
      const reason = decision === "REJECT" ? prompt("Reason for rejection (optional)") ?? undefined : undefined;
      await api<any>(`/admin/payments/${id}/verify`, { method: "POST", body: JSON.stringify({ decision, reason }) });
      await load();
    } finally { setBusyId(null); }
  }

  return (
    <Table
      columns={["Method", "Amount", "Transaction ID", "Status", "Actions"]}
      rows={payments.map((p) => [
        p.method?.replaceAll("_", " "),
        `৳${p.amount}`,
        p.transactionId ?? "—",
        <StatusBadge key="s" status={p.status} />,
        p.status === "SUBMITTED" || p.status === "UNDER_REVIEW" ? (
          <div key="a" className="flex gap-2">
            <AdminButton tone="primary" disabled={busyId === p._id} onClick={() => decide(p._id, "VERIFY")}>Verify</AdminButton>
            <AdminButton tone="danger" disabled={busyId === p._id} onClick={() => decide(p._id, "REJECT")}>Reject</AdminButton>
          </div>
        ) : <span key="a" className="text-ink/30">—</span>,
      ])}
    />
  );
}
