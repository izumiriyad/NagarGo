"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge, AdminButton, Table } from "@/components/admin/AdminUI";

export function RidersTab() {
  const [riders, setRiders] = useState<any[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function load() {
    const r = await api<any>(`/admin/riders?status=${status}`);
    setRiders(r.riders);
  }
  useEffect(() => { load(); }, [status]);

  async function review(id: string, decision: "APPROVE" | "REJECT" | "SUSPEND", withReason?: string) {
    setBusyId(id);
    try {
      await api<any>(`/admin/riders/${id}/review`, { method: "POST", body: JSON.stringify({ decision, reason: withReason }) });
      setReasonFor(null); setReason("");
      await load();
    } finally { setBusyId(null); }
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "SUSPENDED"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === s ? "bg-ink text-white" : "border border-ink/15 text-ink/60"}`}>
            {s.replaceAll("_", " ")}
          </button>
        ))}
      </div>
      <Table
        columns={["Rider", "Phone", "Vehicle", "NID", "Status", "Actions"]}
        rows={riders.map((r) => [
          <span key="n" className="font-semibold">{r.fullName}<br /><span className="font-normal text-ink/40">{r.publicId}</span></span>,
          r.phone,
          r.vehicle?.type,
          <a key="nid" href={r.nid?.documentUrl} target="_blank" rel="noreferrer" className="text-route-green underline">View document</a>,
          <StatusBadge key="s" status={r.status} />,
          <div key="a" className="flex flex-wrap gap-2">
            {r.status !== "VERIFIED" && <AdminButton tone="primary" disabled={busyId === r._id} onClick={() => review(r._id, "APPROVE")}>Approve</AdminButton>}
            {r.status !== "SUSPENDED" && r.status === "VERIFIED" && <AdminButton tone="danger" disabled={busyId === r._id} onClick={() => setReasonFor(r._id)}>Suspend</AdminButton>}
            {r.status !== "REJECTED" && r.status !== "VERIFIED" && <AdminButton tone="danger" disabled={busyId === r._id} onClick={() => setReasonFor(r._id)}>Reject</AdminButton>}
            {reasonFor === r._id && (
              <div className="mt-2 flex w-full gap-2">
                <input className="flex-1 rounded-lg border border-ink/15 px-2 py-1 text-xs" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                <AdminButton tone="danger" onClick={() => review(r._id, r.status === "VERIFIED" ? "SUSPEND" : "REJECT", reason)}>Confirm</AdminButton>
              </div>
            )}
          </div>,
        ])}
      />
    </div>
  );
}
