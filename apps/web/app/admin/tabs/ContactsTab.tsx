"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function ContactsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => { load(page); }, [page]);

  async function load(p: number) {
    setLoading(true);
    try {
      // Contact form submissions are in the AuditLog with action CONTACT_FORM_SUBMITTED
      const r = await api<any>(`/admin/audit?action=CONTACT_FORM_SUBMITTED&page=${p}&limit=30`);
      setItems(r.logs ?? []);
      setPages(r.pages ?? 1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/50">
        All public contact form submissions — submitted via /contact page. Sorted newest first.
      </p>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink/15 py-12 text-center text-sm text-ink/50">
          No contact form submissions yet.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((log, i) => {
            const data = log.after ?? {};
            return (
              <div key={log._id ?? i} className="animate-fade-up rounded-2xl border border-ink/10 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {data.name ?? "—"}{" "}
                      <span className="text-xs font-normal text-ink/50">via</span>{" "}
                      <span className="font-mono text-xs text-route-green">{data.email ?? log.targetId ?? "—"}</span>
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink/70">{data.subject ?? log.reason ?? "—"}</p>
                  </div>
                  <p className="shrink-0 text-xs text-ink/30">
                    {new Date(log.createdAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                {data.message && (
                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-black/[0.02] px-4 py-3 text-sm text-ink/70 leading-relaxed">
                    {data.message}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  {data.email && (
                    <a
                      href={`mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject ?? "Your NagarGo enquiry")}`}
                      className="rounded-full border border-route-green/30 px-3 py-1.5 text-xs font-semibold text-route-green-dark hover:bg-route-green/5 transition"
                    >
                      Reply by email →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-black/5 transition"
          >
            ← Prev
          </button>
          <span className="text-sm text-ink/50">Page {page} of {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-black/5 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
