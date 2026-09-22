"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Earnings {
  totalEarned: number;
  thisMonthEarned: number;
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
  color = "bg-white",
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-100 shadow-sm ${color} p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function RiderEarningsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) {
      router.replace("/login?next=/rider/earnings");
      return;
    }
    api<{ earnings: Earnings }>("/riders/me/earnings")
      .then((r) => setEarnings(r.earnings))
      .catch((e) => setError(e.message ?? "Failed to load earnings."))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
            <p className="text-sm text-gray-400 mt-1">
              Your delivery performance and income summary.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {earnings && (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <StatCard
                  icon="💰"
                  label="Total Earned"
                  value={`৳${earnings.totalEarned.toLocaleString()}`}
                  sub="All time"
                  color="bg-emerald-50"
                />
                <StatCard
                  icon="📅"
                  label="This Month"
                  value={`৳${earnings.thisMonthEarned.toLocaleString()}`}
                  sub={new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                />
                <StatCard
                  icon="📦"
                  label="Deliveries"
                  value={String(earnings.completedDeliveries)}
                  sub="Completed"
                />
                <StatCard
                  icon="❌"
                  label="Cancellations"
                  value={String(earnings.cancellationCount)}
                  sub="Total declines"
                />
                <StatCard
                  icon="⭐"
                  label="Average Rating"
                  value={
                    earnings.averageRating != null
                      ? `${earnings.averageRating.toFixed(1)} / 5`
                      : "No ratings yet"
                  }
                />
                <StatCard
                  icon="🕐"
                  label="Pending Payout"
                  value={`৳${(earnings.pendingPayout ?? 0).toLocaleString()}`}
                  sub="Awaiting settlement"
                  color="bg-amber-50"
                />
              </div>

              {/* Acceptance rate */}
              {earnings.completedDeliveries + earnings.cancellationCount > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
                  <p className="text-sm font-semibold text-gray-500 mb-3">Acceptance Rate</p>
                  {(() => {
                    const total = earnings.completedDeliveries + earnings.cancellationCount;
                    const pct = Math.round((earnings.completedDeliveries / total) * 100);
                    return (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl font-bold text-gray-900">{pct}%</span>
                          <span className="text-sm text-gray-400">
                            {earnings.completedDeliveries} of {total} assignments
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 80
                                ? "bg-emerald-500"
                                : pct >= 60
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {pct < 70 && (
                          <p className="text-xs text-amber-600 mt-2">
                            ⚠️ Low acceptance rate may affect your trust score and order priority.
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Info box */}
              <div className="rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">💡 How payouts work</p>
                <p className="text-blue-600 leading-relaxed">
                  Your earnings (80% of each delivery fare) are credited after delivery
                  confirmation. Payouts are processed weekly to your registered bKash account.
                  Contact your admin for early payout requests.
                </p>
              </div>
            </>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/rider/dashboard")}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
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
