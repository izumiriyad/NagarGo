"use client";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    /VERIFIED|APPROVED|DELIVERED|ACTIVE|RESOLVED|VERIFIED/.test(status) ? "bg-route-green/10 text-route-green-dark" :
    /REJECTED|SUSPENDED|CANCELLED|FAILED|DISPUTED|DISMISSED/.test(status) ? "bg-red-50 text-red-700" :
    /PENDING|SUBMITTED|UNDER_REVIEW|SEARCHING|OPEN/.test(status) ? "bg-amber-50 text-amber-700" :
    "bg-black/5 text-ink/70";
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status.replaceAll("_", " ")}</span>;
}

export function AdminButton({ children, onClick, tone = "default", disabled }: { children: React.ReactNode; onClick?: () => void; tone?: "default" | "primary" | "danger" | "neutral"; disabled?: boolean }) {
  const styles =
    tone === "primary" ? "bg-route-green text-white hover:bg-route-green-dark" :
    tone === "danger" ? "bg-red-600 text-white hover:bg-red-700" :
    tone === "neutral" ? "border border-gray-300 text-gray-700 hover:bg-gray-50" :
    "border border-ink/15 text-ink hover:bg-black/5";
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${styles}`}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-ink/10 bg-white p-5 ${className}`}>{children}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="rounded-xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink/50">{message}</p>;
}

export function Table({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) return <EmptyState message="Nothing here yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
            {columns.map((c) => (
              <th key={c} className="py-2 pr-4 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="animate-fade-up border-b border-ink/5 align-top" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-4">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
