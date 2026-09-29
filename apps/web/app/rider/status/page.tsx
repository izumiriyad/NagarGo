"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const STATUS_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string; title: string; body: string }> = {
  PENDING: {
    icon: "📋",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "Application submitted",
    body: "Our team reviews all rider applications manually. You'll receive a notification within 48 hours.",
  },
  APPROVED: {
    icon: "✅",
    color: "text-route-green-dark",
    bg: "bg-route-green/5",
    border: "border-route-green/20",
    title: "You're approved!",
    body: "Your account is fully verified. Go online from the dashboard to start receiving orders.",
  },
  VERIFIED: {
    icon: "✅",
    color: "text-route-green-dark",
    bg: "bg-route-green/5",
    border: "border-route-green/20",
    title: "Verified rider",
    body: "Your account is active. Head to the dashboard to manage deliveries.",
  },
  REJECTED: {
    icon: "❌",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    title: "Application not approved",
    body: "We couldn't verify your information at this time. Please contact support if you believe this is a mistake.",
  },
  SUSPENDED: {
    icon: "⚠️",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "Account suspended",
    body: "Your account has been temporarily suspended. Contact our support team for details.",
  },
};

const STEPS = [
  { key: "SUBMITTED", label: "Application submitted", done: true },
  { key: "REVIEW", label: "Under review by our team", done: false, active: true },
  { key: "VERIFICATION", label: "ID & vehicle verification", done: false },
  { key: "APPROVED", label: "Approved — ready to ride", done: false },
];

export default function RiderStatusPage() {
  const router = useRouter();
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/rider/status"); return; }
    api<any>("/riders/me")
      .then((r) => setRider(r.rider))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const cfg = rider ? (STATUS_CONFIG[rider.status] ?? STATUS_CONFIG.PENDING) : null;
  const isApproved = rider?.status === "APPROVED" || rider?.status === "VERIFIED";

  const steps = STEPS.map((s, i) => ({
    ...s,
    done: isApproved ? true : i === 0,
    active: !isApproved && i === 1,
  }));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl animate-fade-up px-5 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-route-green">Rider Application</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Application Status</h1>

        {loading && (
          <div className="mt-8 space-y-4">
            <div className="skeleton h-32 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <a href="/rider/register" className="mt-3 block text-sm font-semibold text-route-green underline">
              Apply to become a rider →
            </a>
          </div>
        )}

        {rider && cfg && (
          <>
            {/* Status card */}
            <div className={`mt-6 rounded-3xl border p-6 ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{cfg.icon}</span>
                <div>
                  <p className={`font-display text-xl font-bold ${cfg.color}`}>{cfg.title}</p>
                  <p className={`mt-1 text-sm leading-relaxed ${cfg.color} opacity-80`}>{cfg.body}</p>
                </div>
              </div>
            </div>

            {/* Progress steps */}
            <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="mb-5 font-display text-base font-bold text-ink">Review progress</h2>
              <ol className="space-y-4">
                {steps.map((step, i) => (
                  <li key={step.key} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      step.done
                        ? "bg-route-green text-white"
                        : step.active
                        ? "border-2 border-route-green bg-white text-route-green"
                        : "bg-black/5 text-ink/30"
                    }`}>
                      {step.done ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm font-semibold ${
                      step.done ? "text-ink" : step.active ? "text-route-green-dark" : "text-ink/40"
                    }`}>
                      {step.label}
                    </span>
                    {step.active && (
                      <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                        In progress
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {/* Rider info */}
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-5 text-sm">
              <h2 className="mb-3 font-display text-base font-bold text-ink">Your details</h2>
              <dl className="space-y-2 text-ink/70">
                <div className="flex justify-between">
                  <dt className="text-ink/40">ID</dt>
                  <dd className="font-mono font-semibold">{rider.publicId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/40">Name</dt>
                  <dd>{rider.fullName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/40">Phone</dt>
                  <dd>{rider.phone}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/40">Vehicle</dt>
                  <dd>{rider.vehicle?.type ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/40">Applied</dt>
                  <dd>{new Date(rider.createdAt).toLocaleDateString("en-BD", { dateStyle: "medium" })}</dd>
                </div>
              </dl>
            </div>

            {isApproved && (
              <a
                href="/rider/dashboard"
                className="mt-6 block w-full rounded-xl bg-route-green py-3.5 text-center font-semibold text-white transition hover:bg-route-green-dark"
              >
                Go to rider dashboard →
              </a>
            )}

            <div className="mt-4 text-center text-sm text-ink/50">
              Questions?{" "}
              <a href="/contact" className="font-semibold text-route-green underline">
                Contact support
              </a>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
