"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge, AdminButton, Table, EmptyState } from "@/components/admin/AdminUI";

const DECISIONS = [
  { value: "RESOLVED_CUSTOMER", label: "Side with customer", tone: "primary" as const },
  { value: "RESOLVED_RIDER",    label: "Side with rider",   tone: "neutral" as const },
  { value: "DISMISSED",         label: "Dismiss",           tone: "danger" as const },
];

export function DisputesTab() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [busyId, setBusyId]     = useState<string | null>(null);
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);
  const [noteInput, setNoteInput]         = useState("");
  const [pendingDecision, setPendingDecision] = useState<string>("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await api<any>("/admin/disputes");
      setDisputes(r.disputes ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load disputes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function resolve() {
    if (!resolveTarget || !pendingDecision) return;
    setBusyId(resolveTarget);
    try {
      await api<any>(`/admin/disputes/${resolveTarget}/resolve`, {
        method: "POST",
        body: JSON.stringify({ decision: pendingDecision, note: noteInput || undefined }),
      });
      setResolveTarget(null);
      setNoteInput("");
      setPendingDecision("");
      await load();
    } catch (e: any) {
      setError(e.message ?? "Failed to resolve dispute.");
    } finally {
      setBusyId(null);
    }
  }

  const open   = disputes.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW");
  const closed = disputes.filter((d) => d.status !== "OPEN" && d.status !== "UNDER_REVIEW");

  return (
    <div>
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
      ) : disputes.length === 0 ? (
        <EmptyState message="No disputes filed yet." />
      ) : (
        <>
          {open.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-amber-700">⚠️ Open / Under review ({open.length})</h3>
              <Table
                columns={["Order", "Category", "Reason", "Status", "Actions"]}
                rows={open.map((d) => [
                  d.orderId
                    ? <a key="o" href={`/orders/${d.orderId}/track`} className="font-mono text-xs text-route-green underline" target="_blank" rel="noreferrer">
                        View order
                      </a>
                    : <span key="o" className="text-ink/30">—</span>,
                  <span key="c" className="text-xs">{d.category?.replaceAll("_", " ")}</span>,
                  <span key="r" className="line-clamp-2 max-w-xs text-xs text-ink/70">{d.reason}</span>,
                  <StatusBadge key="s" status={d.status} />,
                  <div key="a" className="flex flex-wrap gap-2">
                    {DECISIONS.map(({ value, label, tone }) => (
                      <AdminButton
                        key={value}
                        tone={tone}
                        disabled={busyId === d._id}
                        onClick={() => {
                          setResolveTarget(d._id);
                          setPendingDecision(value);
                          setNoteInput("");
                        }}
                      >
                        {label}
                      </AdminButton>
                    ))}
                  </div>,
                ])}
              />
            </div>
          )}

          {closed.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-ink/50">Resolved ({closed.length})</h3>
              <Table
                columns={["Category", "Decision", "Note", "Closed"]}
                rows={closed.map((d) => [
                  d.category?.replaceAll("_", " "),
                  <StatusBadge key="s" status={d.status} />,
                  <span key="n" className="text-xs text-ink/60">{d.resolutionNote ?? "—"}</span>,
                  <span key="w" className="whitespace-nowrap text-xs text-ink/50">{new Date(d.updatedAt ?? d.createdAt).toLocaleDateString()}</span>,
                ])}
              />
            </div>
          )}
        </>
      )}

      {/* Inline resolution modal (no prompt()) */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl mx-4">
            <h3 className="mb-3 font-bold text-ink">Resolve dispute</h3>
            <p className="mb-4 text-sm text-ink/60">
              Decision: <b>{pendingDecision.replaceAll("_", " ")}</b>
            </p>
            <textarea
              className="w-full rounded-xl border border-ink/15 p-3 text-sm"
              placeholder="Resolution note (shown to the customer — optional)"
              rows={3}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={resolve}
                disabled={!!busyId}
                className="flex-1 rounded-xl bg-ink py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busyId ? "Saving…" : "Confirm"}
              </button>
              <button
                onClick={() => { setResolveTarget(null); setPendingDecision(""); }}
                className="flex-1 rounded-xl border border-ink/15 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
