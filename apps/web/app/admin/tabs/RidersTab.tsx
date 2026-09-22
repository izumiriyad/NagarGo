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
  const [earningsRider, setEarningsRider] = useState<any | null>(null);
  const [earningsData, setEarningsData] = useState<any | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [activeCount, setActiveCount] = useState<number | null>(null);

  async function load() {
    const r = await api<any>(`/admin/riders?status=${status}`);
    setRiders(r.riders);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [status]);

  useEffect(() => {
    api<any>("/admin/riders/active")
      .then((r) => setActiveCount(r.count))
      .catch(() => {});
  }, []);

  async function review(id: string, decision: "APPROVE" | "REJECT" | "SUSPEND", withReason?: string) {
    setBusyId(id);
    try {
      await api<any>(`/admin/riders/${id}/review`, { method: "POST", body: JSON.stringify({ decision, reason: withReason }) });
      setReasonFor(null); setReason("");
      await load();
    } finally { setBusyId(null); }
  }

  async function openEarnings(rider: any) {
    setEarningsRider(rider);
    setEarningsData(null);
    setEarningsLoading(true);
    try {
      const r = await api<any>(`/admin/riders/${rider._id}/earnings`);
      setEarningsData(r.earnings);
    } finally {
      setEarningsLoading(false);
    }
  }

  return (
    <div>
      {/* Active riders banner */}
      {activeCount !== null && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-route-green/10 px-4 py-1.5 text-sm font-semibold text-route-green-dark">
          <span className="h-2 w-2 rounded-full bg-route-green animate-pulse" />
          {activeCount} rider{activeCount !== 1 ? "s" : ""} online now
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
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
            <AdminButton tone="neutral" onClick={() => openEarnings(r)}>Earnings</AdminButton>
            {reasonFor === r._id && (
              <div className="mt-2 flex w-full gap-2">
                <input className="flex-1 rounded-lg border border-ink/15 px-2 py-1 text-xs" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                <AdminButton tone="danger" onClick={() => review(r._id, r.status === "VERIFIED" ? "SUSPEND" : "REJECT", reason)}>Confirm</AdminButton>
              </div>
            )}
          </div>,
        ])}
      />

      {/* Earnings modal */}
      {earningsRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Rider Earnings</h3>
              <button onClick={() => setEarningsRider(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{earningsRider.fullName} · {earningsRider.publicId}</p>
            {earningsLoading && <p className="text-center text-gray-400 py-6">Loading…</p>}
            {earningsData && (
              <dl className="space-y-3">
                {[
                  ["Total Earned", `৳${earningsData.totalEarned}`],
                  ["This Month", `৳${earningsData.thisMonthEarned}`],
                  ["Deliveries", earningsData.completedDeliveries],
                  ["Cancellations", earningsData.cancellationCount],
                  ["Avg Rating", `${earningsData.averageRating ?? "—"} ★`],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between text-sm">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-semibold text-gray-900">{val}</dd>
                  </div>
                ))}
              </dl>
            )}
            <button
              onClick={() => setEarningsRider(null)}
              className="mt-6 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
