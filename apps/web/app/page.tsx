import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RouteAnimation } from "@/components/RouteAnimation";

export const metadata: Metadata = {
  title: "NagarGo — Trusted Local Delivery in Rajshahi",
  description: "Send anything. Get anything. Delivered by ID-verified riders across Rajshahi, with real-time tracking, OTP-protected handoff, and Medicine Express.",
  openGraph: {
    title: "NagarGo — Trusted Local Delivery in Rajshahi",
    description: "Send anything. Get anything. Delivered by someone you trust.",
    url: "https://nagargo.com",
    siteName: "NagarGo",
    locale: "en_BD",
    type: "website",
  },
};

const stats = [
  { value: "2 min", label: "Avg. rider response" },
  { value: "4.9 ★", label: "Customer rating" },
  { value: "100%", label: "ID-verified riders" },
  { value: "OTP", label: "Protected handoff" },
];

const steps = [
  {
    n: "01",
    icon: "📍",
    title: "Book in seconds",
    body: "Pick a pickup, a destination, and tell us what's moving — pricing calculates automatically based on distance and category.",
  },
  {
    n: "02",
    icon: "🏍️",
    title: "Verified rider accepts",
    body: "A nearby ID-verified rider accepts your request. You'll see their name, vehicle, and live location from the moment they head out.",
  },
  {
    n: "03",
    icon: "📡",
    title: "Live tracking",
    body: "Watch your delivery move on a live map. Get status updates at every stage — pickup, in-transit, and at your door.",
  },
  {
    n: "04",
    icon: "🔐",
    title: "OTP-protected delivery",
    body: "A unique one-time code at pickup and drop-off confirms it changed hands correctly. No code, no release.",
  },
];

const services = [
  {
    icon: "📦",
    title: "NagarGo Delivery",
    desc: "Documents, keys, gifts, parcels, electronics — any legally permitted item, delivered anywhere across Rajshahi by a verified rider.",
    cta: "Book a delivery",
    href: "/book",
    accent: "bg-emerald-50 border-emerald-200",
    ctaClass: "bg-route-green text-white hover:bg-route-green-dark",
  },
  {
    icon: "💊",
    title: "Medicine Express",
    desc: "Licensed medicine delivery with prescription verification. Pharmacy details and compliance controls built into every order.",
    cta: "Order medicine",
    href: "/medicine",
    accent: "bg-blue-50 border-blue-200",
    ctaClass: "bg-blue-600 text-white hover:bg-blue-700",
  },
];

const trust = [
  { icon: "🪪", title: "ID-verified riders", body: "Every rider submits NID documents and goes through manual review before they see a single order." },
  { icon: "📍", title: "Real-time GPS", body: "Live location shared from the moment your rider heads to pickup until delivery is confirmed." },
  { icon: "🔐", title: "OTP handoff", body: "Unique codes at pickup and drop-off mean your delivery can only change hands with your confirmation." },
  { icon: "💬", title: "Telegram alerts", body: "Riders and admins get instant Telegram notifications for every status change, no app required." },
  { icon: "💳", title: "Flexible payment", body: "Cash on delivery, rider bKash, or admin bKash — choose what works for you at checkout." },
  { icon: "⚖️", title: "Dispute resolution", body: "Built-in dispute flow with admin review ensures both customers and riders are protected." },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-[#F6F7F5]">
          {/* Subtle grid background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: "linear-gradient(#0B1220 1px, transparent 1px), linear-gradient(90deg, #0B1220 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-2 lg:items-center lg:py-28">
            <div className="animate-fade-up">
              {/* Eyebrow */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-route-green/30 bg-route-green/10 px-4 py-1.5 text-xs font-semibold text-route-green-dark">
                <span className="h-1.5 w-1.5 rounded-full bg-route-green" />
                Now live in Rajshahi
              </div>

              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Rajshahi&apos;s smartest,{" "}
                <span className="text-route-green">trusted</span>{" "}
                delivery network
              </h1>
              <p className="mt-6 max-w-lg text-lg text-ink/65 leading-relaxed">
                Send anything — documents, keys, medicine, gifts. Delivered by
                ID-verified riders with live tracking and OTP-protected handoff.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  id="send-something"
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-full bg-route-green px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-route-green/20 transition hover:bg-route-green-dark hover:-translate-y-0.5"
                >
                  Send something →
                </a>
                <a
                  href="/medicine"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-7 py-3.5 text-sm font-semibold text-ink shadow-sm transition hover:border-ink/25 hover:-translate-y-0.5"
                >
                  💊 Medicine Express
                </a>
              </div>

              {/* Stats strip */}
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-ink/8 bg-white/70 px-4 py-3 backdrop-blur-sm">
                    <p className="font-display text-xl font-bold text-ink">{s.value}</p>
                    <p className="mt-0.5 text-xs text-ink/50">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md animate-fade-up" style={{ animationDelay: "120ms" }}>
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-route-green/15 via-transparent to-blue-100/40 blur-2xl" />
                <div className="relative rounded-[2rem] border border-ink/8 bg-white/80 p-6 shadow-xl backdrop-blur-md">
                  <RouteAnimation />
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F6F7F5] px-4 py-2.5 text-sm">
                    <span className="font-semibold text-ink">Live delivery active</span>
                    <span className="flex items-center gap-1.5 text-route-green font-semibold text-xs">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-route-green" />
                      Tracking
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="border-t border-ink/8 bg-white py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-route-green">Our services</div>
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              Two services, one trusted network
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {services.map((s) => (
                <div
                  key={s.title}
                  className={`group relative overflow-hidden rounded-3xl border p-8 transition hover:-translate-y-1 hover:shadow-xl ${s.accent}`}
                >
                  <div className="mb-4 text-4xl">{s.icon}</div>
                  <h3 className="font-display text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-3 text-ink/65 leading-relaxed">{s.desc}</p>
                  <a
                    href={s.href}
                    className={`mt-6 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 ${s.ctaClass}`}
                  >
                    {s.cta} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-route-green">How it works</div>
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              From booking to doorstep in minutes
            </h2>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={step.n} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-route-green/10 text-2xl">
                    {step.icon}
                  </div>
                  <span className="font-display text-xs font-bold text-route-green">{step.n}</span>
                  <h3 className="mt-1.5 font-display text-base font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm text-ink/60 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust signals ── */}
        <section className="border-t border-ink/8 bg-ink py-20 text-white">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-route-green">Why NagarGo</div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Built for trust, not just speed
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trust.map((t) => (
                <div
                  key={t.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10 hover:-translate-y-0.5"
                >
                  <div className="mb-3 text-2xl">{t.icon}</div>
                  <h3 className="font-display font-bold">{t.title}</h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Become a rider ── */}
        <section id="become-a-rider" className="relative overflow-hidden bg-gradient-to-br from-route-green via-[#1a7a3a] to-[#0f5c2c] py-20 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)",
            }}
          />
          <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-white/70">Join the fleet</div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Ride with NagarGo</h2>
              <p className="mt-4 text-white/80 leading-relaxed text-lg">
                Set your own hours, get paid per delivery, and build a trust score that
                unlocks priority requests. We verify you once — then you ride on your terms.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2"><span className="text-white">✓</span> Flexible schedule — go online when you want</li>
                <li className="flex items-center gap-2"><span className="text-white">✓</span> Transparent per-delivery earnings</li>
                <li className="flex items-center gap-2"><span className="text-white">✓</span> Trust score builds over time — more orders, better pay</li>
                <li className="flex items-center gap-2"><span className="text-white">✓</span> Telegram notifications so you never miss an assignment</li>
              </ul>
            </div>
            <a
              href="/rider/register"
              className="shrink-0 rounded-full bg-white px-8 py-4 text-sm font-bold text-route-green shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Apply to ride →
            </a>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="border-t border-ink/8 bg-[#F6F7F5] py-20 text-center">
          <div className="mx-auto max-w-xl px-5">
            <div className="mb-4 text-4xl">🚀</div>
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              Ready to send something?
            </h2>
            <p className="mt-4 text-ink/60 leading-relaxed">
              It takes under a minute to book. Your rider is already nearby.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/book"
                className="rounded-full bg-route-green px-8 py-4 text-sm font-semibold text-white shadow-md shadow-route-green/20 transition hover:bg-route-green-dark hover:-translate-y-0.5"
              >
                Book a delivery →
              </a>
              <a
                href="/signup"
                className="rounded-full border border-ink/15 bg-white px-8 py-4 text-sm font-semibold text-ink transition hover:border-ink/25 hover:-translate-y-0.5"
              >
                Create account
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
