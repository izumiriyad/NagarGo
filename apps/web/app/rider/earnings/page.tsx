"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Earnings {
  totalEarned: number;
  thisMonthEarned: number;
  thisWeekEarned: number;
  todayEarned: number;
  completedDeliveries: number;
  cancellationCount: number;
  averageRating: number | null;
  pendingPayout: number;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-route-green/20 bg-route-green/5" : "border-ink/10 bg-white"}`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${accent ? "text-route-green-dark" : "text-ink"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/40">{sub}</p>}
    </div>
  );
}

export default function RiderEarningsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/rider/earnings"); return; }
    api<{ earnings: Earnings }>("/riders/me/earnings")
      .then((r) => setEarnings(r.earnings))
      .catch((e) => setError(e.message ?? "Failed to load earnings."))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F6F7F5] px-5 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 animate-fade-up">
            <p className="text-xs font-bold uppercase tracking-widest text-route-green">Rider Panel</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink">Earnings</h1>
            <p className="mt-1 text-sm text-ink/60">Your delivery performance and income summary.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-28 rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          )}

          {earnings && (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4 animate-fade-up">
                <StatCard
                  icon="💰"
                  label="Total Earned"
                  value={`৳${earnings.totalEarned.toLocaleString()}`}
                  sub="All time"
                  accent
                />
                <StatCard
                  icon="📅"
                  label="This Month"
                  value={`৳${earnings.thisMonthEarned.toLocaleString()}`}
                  sub={new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                />
                <StatCard
                  icon="📆"
                  label="This Week"
                  value={`৳${earnings.thisWeekEarned.toLocaleString()}`}
                  sub="Mon – Sun"
                />
                <StatCard
                  icon="🌅"
                  label="Today"
                  value={`৳${earnings.todayEarned.toLocaleString()}`}
                  sub={new Date().toLocaleDateString("en-BD")}
                />
                <StatCard
                  icon="📦"
                  label="Deliveries"
                  value={String(earnings.completedDeliveries)}
                  sub="Completed"
                />
                <StatCard
                  icon="⭐"
                  label="Avg Rating"
                  value={
                    earnings.averageRating != null
                      ? `${earnings.averageRating.toFixed(1)} / 5`
                      : "—"
                  }
                />
              </div>

              {/* Pending payout */}
              {earnings.pendingPayout > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-800">🕐 Pending Payout</p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">৳{earnings.pendingPayout.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-amber-700">Awaiting weekly settlement</p>
                </div>
              )}

              {/* Acceptance rate bar */}
              {earnings.completedDeliveries + earnings.cancellationCount > 0 && (
                <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/50">Acceptance Rate</p>
                  {(() => {
                    const total = earnings.completedDeliveries + earnings.cancellationCount;
                    const pct = Math.round((earnings.completedDeliveries / total) * 100);
                    return (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-2xl font-bold text-ink">{pct}%</span>
                          <span className="text-xs text-ink/50">
                            {earnings.completedDeliveries} of {total} assignments
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-black/5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 80 ? "bg-route-green" : pct >= 60 ? "bg-amber-400" : "bg-red-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {pct < 70 && (
                          <p className="mt-2 text-xs text-amber-600">
                            ⚠️ Low acceptance rate may affect your trust score and order priority.
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Payout info */}
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
                <p className="mb-1 font-semibold">💡 How payouts work</p>
                <p className="leading-relaxed text-blue-600">
                  Your earnings (80% of each delivery fare) are credited after delivery confirmation.
                  Payouts are processed weekly to your registered bKash account. Contact your admin for
                  early payout requests.
                </p>
              </div>
            </>
          )}

          <div className="mt-10 text-center">
            <button
              onClick={() => router.push("/rider/dashboard")}
              className="text-sm font-semibold text-ink/40 underline underline-offset-2 transition hover:text-ink"
            >
              ← Back to dashboard
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
