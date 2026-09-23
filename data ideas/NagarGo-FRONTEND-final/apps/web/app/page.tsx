import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RouteAnimation } from "@/components/RouteAnimation";

const steps = [
  { n: "01", title: "Book", body: "Tell us what needs to move and where — a document, a gift, medicine, anything permitted." },
  { n: "02", title: "Verified rider", body: "A nearby, ID-verified rider accepts your request and heads to pickup." },
  { n: "03", title: "Track", body: "Watch your delivery move in real time, from pickup to your door." },
  { n: "04", title: "OTP-protected delivery", body: "A one-time code at pickup and at drop-off confirms it changed hands correctly." },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        <section className="hero-section mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="relative flex items-start gap-4 sm:gap-7">
            <div className="hero-tower-wrap shrink-0" aria-hidden="true">
              <Image
                src="/nagar-go-tower-cutout.png"
                alt="Illustration of Rajshahi's historic tower"
                width={190}
                height={308}
                priority
                className="hero-tower"
              />
            </div>
            <div className="relative z-10">
            <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Rajshahi&rsquo;s smartest, trusted delivery network
            </h1>
            <p className="mt-5 max-w-prose text-lg text-ink/70">
              Send anything. Get anything. Delivered by someone you trust.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                id="send-something"
                href="/book"
                className="rounded-full bg-route-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-route-green-dark"
              >
                Send something
              </a>
              <a
                href="/medicine"
                className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
              >
                Medicine Express
              </a>
              <a
                href="#become-a-rider"
                className="rounded-full px-6 py-3 text-sm font-semibold text-ink/70 transition hover:text-ink"
              >
                Become a rider
              </a>
            </div>
            </div>
          </div>

          <RouteAnimation />
        </section>

        <section id="services" className="border-t border-ink/10 bg-white py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Two services, one trusted network</h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-ink/10 p-6">
                <h3 className="font-display text-lg font-bold text-ink">NagarGo Delivery</h3>
                <p className="mt-2 text-ink/70">
                  Documents, keys, gifts, parcels, electronics — verified riders carry legally permitted
                  items anywhere across Rajshahi.
                </p>
              </div>
              <div id="medicine" className="rounded-2xl border border-ink/10 p-6">
                <h3 className="font-display text-lg font-bold text-ink">Medicine Express</h3>
                <p className="mt-2 text-ink/70">
                  Licensed medicine delivery with prescription and pharmacy details recorded for every
                  order, under NagarGo&rsquo;s compliance controls.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">How it works</h2>

            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div key={step.n}>
                  <span className="font-display text-sm font-bold text-route-green">{step.n}</span>
                  <h3 className="mt-2 font-display text-base font-bold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm text-ink/70">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="become-a-rider" className="border-t border-ink/10 bg-ink/[0.03] py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Ride with NagarGo</h2>
              <p className="mt-2 max-w-prose text-ink/70">
                Set your own hours, get paid per delivery, and build a trust score that unlocks more requests.
              </p>
            </div>
            <a
              href="/rider/register"
              className="shrink-0 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              Apply to ride
            </a>
          </div>
        </section>
      </main>

      <Footer />

      <a
        href="https://wa.me/8801683772714"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with NagarGo on WhatsApp"
        className="whatsapp-float group"
      >
        <span className="whatsapp-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" role="img">
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.48 0 .13 5.35.13 11.92c0 2.1.55 4.15 1.6 5.96L.03 24l6.26-1.64a11.88 11.88 0 0 0 5.76 1.47h.01c6.57 0 11.91-5.35 11.91-11.92 0-3.18-1.24-6.17-3.45-8.43Zm-8.47 18.3h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.72.98.99-3.63-.23-.37a9.88 9.88 0 0 1-1.52-5.25C2.17 6.48 6.6 2.05 12.05 2.05c2.64 0 5.12 1.03 6.98 2.9a9.84 9.84 0 0 1 2.89 7c0 5.45-4.43 9.88-9.87 9.88Zm5.42-7.4c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.09 4.49.71.31 1.26.49 1.69.63.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
          </svg>
        </span>
        <span className="whatsapp-label">Chat with NagarGo</span>
      </a>
    </>
  );
}
