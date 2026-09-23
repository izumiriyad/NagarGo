import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact & Support — NagarGo",
  description: "Get help with your NagarGo order. Contact us on WhatsApp, email, or browse our frequently asked questions.",
};

const faqs = [
  {
    q: "How long does a delivery usually take?",
    a: "Most deliveries within Rajshahi city complete in 20–40 minutes depending on traffic and distance. You'll see a live ETA from the moment your rider is assigned.",
  },
  {
    q: "Can I track my delivery in real-time?",
    a: "Yes. Once a rider is assigned, open your order and tap 'Track' — you'll see their live location on a map until delivery is confirmed.",
  },
  {
    q: "What is the OTP at pickup and delivery?",
    a: "NagarGo uses a one-time code shown in your app to confirm handoff. At pickup, show the code to the rider. At delivery, the recipient shows their code. This ensures only authorised people release the item.",
  },
  {
    q: "How do I pay for a delivery?",
    a: "You can pay Cash on Delivery (give cash to the rider), via bKash to the rider, or via bKash to the NagarGo admin account. Choose your method at checkout.",
  },
  {
    q: "Can I cancel an order?",
    a: "Yes. You can cancel from the order detail page before the rider picks up the item. After pickup, cancellation requires contacting support.",
  },
  {
    q: "What items can I send?",
    a: "Any legally permitted item — documents, parcels, gifts, keys, electronics, medicine (via Medicine Express). Prohibited items include weapons, illegal substances, and hazardous materials.",
  },
  {
    q: "My order has an issue — what do I do?",
    a: "Open the order, tap 'File a dispute', and describe the problem. Our admin team reviews disputes and responds within 24 hours.",
  },
  {
    q: "How do I become a NagarGo rider?",
    a: "Go to the 'Become a rider' page, fill in your details, upload your NID, and submit. Our team reviews your application and notifies you within 48 hours.",
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-[#F6F7F5] py-16">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">Support</div>
            <h1 className="font-display text-4xl font-bold text-[#0B1220] sm:text-5xl">
              How can we help you?
            </h1>
            <p className="mt-4 text-lg text-[#0B1220]/60 leading-relaxed">
              We&apos;re here seven days a week. Reach us on WhatsApp for the fastest response.
            </p>
          </div>
        </section>

        {/* Contact channels */}
        <section className="border-t border-[#0B1220]/8 bg-white py-16">
          <div className="mx-auto max-w-4xl px-5">
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: "💬",
                  title: "WhatsApp",
                  body: "Fastest response — usually under 15 minutes during business hours.",
                  cta: "Chat on WhatsApp",
                  href: "https://wa.me/8801683772714",
                  accent: "border-green-200 bg-green-50",
                  ctaClass: "bg-green-600 text-white hover:bg-green-700",
                },
                {
                  icon: "✉️",
                  title: "Email",
                  body: "For detailed issues, receipts, refund requests, or formal complaints.",
                  cta: "Send an email",
                  href: "mailto:support@nagargo.com",
                  accent: "border-blue-200 bg-blue-50",
                  ctaClass: "bg-blue-600 text-white hover:bg-blue-700",
                },
                {
                  icon: "🕐",
                  title: "Support hours",
                  body: "Saturday – Thursday: 9 AM – 9 PM\nFriday: 2 PM – 9 PM\n(Bangladesh Standard Time)",
                  cta: null,
                  href: null,
                  accent: "border-[#0B1220]/10 bg-[#F6F7F5]",
                  ctaClass: "",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className={`rounded-3xl border p-6 ${c.accent}`}
                >
                  <div className="mb-3 text-3xl">{c.icon}</div>
                  <h2 className="font-display text-lg font-bold text-[#0B1220]">{c.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#0B1220]/60 whitespace-pre-line">{c.body}</p>
                  {c.cta && c.href && (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-5 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 ${c.ctaClass}`}
                    >
                      {c.cta} →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">
              FAQ
            </div>
            <h2 className="font-display text-3xl font-bold text-[#0B1220] sm:text-4xl">
              Frequently asked questions
            </h2>

            <div className="mt-10 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-[#0B1220]/10 bg-white px-6 py-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <span className="font-semibold text-[#0B1220]">{faq.q}</span>
                    <span className="shrink-0 text-[#0B1220]/40 transition group-open:rotate-45">＋</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#0B1220]/60">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
