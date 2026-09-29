"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge, AdminButton, Table, EmptyState } from "@/components/admin/AdminUI";
import { useDebounce } from "@/lib/hooks/useDebounce";

export function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE = 25;

  async function load(p = 1, q = "") {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(PAGE) });
      if (q.trim()) qs.set("search", q.trim());
      const r = await api<any>(`/admin/users?${qs}`);
      setUsers(r.users ?? []);
      setPages(r.pages ?? 1);
      setTotal(r.total ?? (r.users?.length ?? 0));
    } catch (e: any) {
      setError(e.message ?? "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => { load(1, ""); }, []); // eslint-disable-line
  // Live search on debounce change
  useEffect(() => { setPage(1); load(1, debouncedSearch); }, [debouncedSearch]); // eslint-disable-line

  async function setStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    setBusyId(id);
    try {
      await api<any>(`/admin/users/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      await load(page, debouncedSearch);
    } catch (e: any) {
      setError(e.message ?? "Failed to update user.");
    } finally {
      setBusyId(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(1, searchInput);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
            placeholder="Search by name or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="rounded-xl border border-ink/15 px-3 py-2 text-sm font-semibold hover:bg-black/5 transition">
            Search
          </button>
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); }}
              className="text-sm text-ink/40 hover:text-ink/70"
            >
              Clear
            </button>
          )}
        </form>
        <span className="text-sm text-ink/40">{total} users</span>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState message={debouncedSearch ? `No users match "${debouncedSearch}".` : "No customers registered yet."} />
      ) : (
        <Table
          columns={["Name", "Username", "Phone", "Email", "Joined", "Status", "Actions"]}
          rows={users.map((u) => [
            <span key="n" className="font-semibold">{u.name ?? "—"}</span>,
            <span key="u" className="text-xs text-ink/60">{u.username ?? "—"}</span>,
            u.phone,
            <span key="e" className="max-w-[140px] truncate text-xs text-ink/70">{u.email ?? "—"}</span>,
            <span key="j" className="whitespace-nowrap text-xs text-ink/50">
              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
            </span>,
            <StatusBadge key="s" status={u.status ?? "ACTIVE"} />,
            <AdminButton
              key="a"
              tone={u.status === "SUSPENDED" ? "primary" : "danger"}
              disabled={busyId === u._id}
              onClick={() => setStatus(u._id, u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")}
            >
              {busyId === u._id ? "…" : u.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
            </AdminButton>,
          ])}
        />
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            disabled={page <= 1}
            onClick={() => { const p = page - 1; setPage(p); load(p, debouncedSearch); }}
            className="rounded-lg border border-ink/15 px-3 py-1.5 font-semibold disabled:opacity-40 hover:bg-black/5 transition"
          >
            ← Prev
          </button>
          <span className="text-ink/50">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => { const p = page + 1; setPage(p); load(p, debouncedSearch); }}
            className="rounded-lg border border-ink/15 px-3 py-1.5 font-semibold disabled:opacity-40 hover:bg-black/5 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
