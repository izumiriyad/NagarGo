"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Table } from "@/components/admin/AdminUI";

export function AuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE = 50;

  async function load(p = 1, q = search) {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(PAGE) });
      if (q.trim()) qs.set("action", q.trim());
      const r = await api<any>(`/admin/audit-logs?${qs}`);
      setLogs(r.logs ?? []);
      setPages(r.pages ?? 1);
      setTotal(r.total ?? (r.logs?.length ?? 0));
    } catch (e: any) {
      setError(e.message ?? "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    load(1, searchInput);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
            placeholder="Filter by action (e.g. APPROVE_RIDER)…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm font-semibold hover:bg-black/5 transition"
          >
            Filter
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setSearch(""); setPage(1); load(1, ""); }}
              className="rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink/50 hover:bg-black/5 transition"
            >
              Clear
            </button>
          )}
        </form>
        <span className="text-sm text-ink/40">{total} events</span>
        <button
          onClick={() => load(page, search)}
          className="ml-auto rounded-xl border border-ink/15 px-3 py-2 text-sm font-semibold hover:bg-black/5 transition"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-10 rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink/40">No audit events found.</p>
      ) : (
        <Table
          columns={["Action", "Actor", "Target", "Reason / Detail", "When"]}
          rows={logs.map((l) => [
            <span key="a" className="font-mono text-xs font-semibold">{l.action}</span>,
            <span key="actor" className="text-xs">
              {l.actorType}
              {l.actorId ? <span className="ml-1 text-ink/40">…{String(l.actorId).slice(-6)}</span> : null}
            </span>,
            l.targetType
              ? <span key="tgt" className="text-xs">{l.targetType} <span className="text-ink/40">…{String(l.targetId ?? "").slice(-6)}</span></span>
              : <span key="tgt" className="text-ink/30">—</span>,
            <span key="r" className="max-w-xs truncate text-xs text-ink/60">{l.reason ?? l.detail ?? "—"}</span>,
            <span key="w" className="whitespace-nowrap text-xs text-ink/50">{new Date(l.createdAt).toLocaleString()}</span>,
          ])}
        />
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            disabled={page <= 1}
            onClick={() => { const p = page - 1; setPage(p); load(p, search); }}
            className="rounded-lg border border-ink/15 px-3 py-1.5 font-semibold disabled:opacity-40 hover:bg-black/5 transition"
          >
            ← Prev
          </button>
          <span className="text-ink/50">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => { const p = page + 1; setPage(p); load(p, search); }}
            className="rounded-lg border border-ink/15 px-3 py-1.5 font-semibold disabled:opacity-40 hover:bg-black/5 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
