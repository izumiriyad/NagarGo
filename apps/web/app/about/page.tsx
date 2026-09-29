import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "About NagarGo — Rajshahi's Local Delivery Platform",
  description:
    "Learn about NagarGo's mission to connect Rajshahi with trusted, verified local riders for fast and transparent deliveries.",
};

const STATS = [
  { value: "500+", label: "Deliveries completed" },
  { value: "50+", label: "Verified riders" },
  { value: "20 min", label: "Average delivery time" },
  { value: "4.8 ★", label: "Customer satisfaction" },
];

const VALUES = [
  {
    icon: "🔒",
    title: "Trust first",
    body: "Every rider is ID-verified and reviewed by our team. You'll always know who is carrying your package.",
  },
  {
    icon: "📍",
    title: "Full transparency",
    body: "Live GPS tracking, OTP handoffs at pickup and delivery, and a complete status timeline — nothing is hidden.",
  },
  {
    icon: "⚡",
    title: "Speed without compromise",
    body: "We optimise for fast matching, proximity dispatch, and real-time routing — so your delivery arrives on time.",
  },
  {
    icon: "🤝",
    title: "Rider partnership",
    body: "Riders keep 80% of every fare. We give them the tools to earn well and work safely on their own schedule.",
  },
  {
    icon: "🏘️",
    title: "Built for Rajshahi",
    body: "We're not a copy-paste startup. NagarGo is built specifically for Rajshahi's streets, communities, and people.",
  },
  {
    icon: "💊",
    title: "Medicine Express",
    body: "Our Medicine Express service handles prescription verification and priority dispatch for healthcare deliveries.",
  },
];

const TIMELINE = [
  { year: "2024", event: "NagarGo founded in Rajshahi" },
  { year: "2024", event: "First 10 riders onboarded and verified" },
  { year: "2025", event: "500+ deliveries completed across the city" },
  { year: "2025", event: "Medicine Express launched for healthcare needs" },
  { year: "2026", event: "Platform rebuilt with real-time tracking and full PWA support" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-[#F6F7F5] py-20">
          <div className="mx-auto max-w-4xl px-5 text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-route-green">
              Our story
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Rajshahi deserves a{" "}
              <span className="text-route-green">delivery platform</span>{" "}
              built for it
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink/60">
              NagarGo was born out of frustration with unreliable, impersonal courier services.
              We built a platform where every rider is a known, verified member of the community —
              and every customer can see exactly where their package is.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-ink/8 bg-white py-16">
          <div className="mx-auto max-w-4xl px-5">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-4xl font-bold text-route-green">{s.value}</p>
                  <p className="mt-1 text-sm text-ink/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-route-green">Mission</div>
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              Making local delivery as natural as a phone call
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink/60">
              We believe that sending something across town should be as easy and reliable as making a
              phone call to a trusted neighbour. NagarGo provides the infrastructure — the matching,
              the tracking, the verification — while the actual delivery is done by real people from
              your community who take pride in their work.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink/60">
              We don't compete on price by cutting corners. We compete on{" "}
              <strong className="text-ink">trust</strong>,{" "}
              <strong className="text-ink">transparency</strong>, and{" "}
              <strong className="text-ink">reliability</strong>.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="bg-[#F6F7F5] py-20">
          <div className="mx-auto max-w-5xl px-5">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-route-green">
              What we stand for
            </div>
            <h2 className="mb-12 text-center font-display text-3xl font-bold text-ink sm:text-4xl">
              Our values
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="rounded-3xl border border-ink/8 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 text-3xl">{v.icon}</div>
                  <h3 className="font-display text-lg font-bold text-ink">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-route-green">History</div>
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">Our journey</h2>
            <ol className="mt-10 space-y-4">
              {TIMELINE.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-route-green text-xs font-bold text-white">
                      {item.year.slice(2)}
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className="w-0.5 flex-1 bg-route-green/20" style={{ minHeight: 24 }} />
                    )}
                  </div>
                  <div className="pt-1.5">
                    <p className="text-xs font-semibold text-ink/40">{item.year}</p>
                    <p className="mt-0.5 font-semibold text-ink">{item.event}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-ink py-20">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Join Rajshahi's delivery network
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Send your first delivery or become a verified rider today.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/book"
                className="rounded-full bg-route-green px-8 py-4 font-semibold text-white transition hover:bg-route-green-dark"
              >
                Book a delivery →
              </a>
              <a
                href="/rider/register"
                className="rounded-full border border-white/20 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                Become a rider
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
