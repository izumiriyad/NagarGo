"use client";
import { useState } from "react";

const faqs = [
  {
    q: "How does NagarGo work?",
    a: "NagarGo connects you with ID-verified riders in Rajshahi for parcel delivery and Medicine Express. Book a delivery at /book, our system auto-assigns the nearest available rider, and you track them live with OTP-protected handoff at both pickup and drop-off.",
  },
  {
    q: "How is the fare calculated?",
    a: "Fares are computed server-side: base fare + (distance in km × per-km rate) + service fee. For Rajshahi: base fare ৳40, ৳12/km, minimum ৳50, service fee ৳5. Peak and emergency surcharges may apply. The full breakdown is shown before you confirm — no surprises.",
  },
  {
    q: "How does OTP verification work?",
    a: "Two OTPs protect every delivery. (1) Pickup OTP — the sender sees a 6-digit code in the app and shows it to the rider at collection. (2) Delivery OTP — the receiver sees a code in the app and shows it to the rider at drop-off. No code = no release.",
  },
  {
    q: "How do I pay for a delivery?",
    a: "Three options: (1) Cash on Delivery — pay the rider directly in cash. (2) Pay to Rider bKash — send bKash Send Money to the rider's number, copy the transaction ID, and submit it. (3) Pay to Admin bKash — send to NagarGo's admin bKash number. All bKash payments are manually verified by our team.",
  },
  {
    q: "What is Medicine Express?",
    a: "Medicine Express lets you upload a doctor's prescription and specify your pharmacy. Our admin reviews the order before dispatch. A verified rider collects the medicine and delivers it. Prescriptions are stored securely and never shared with third parties.",
  },
  {
    q: "How do I become a NagarGo rider?",
    a: "Visit /rider/register, fill in your name, NID number, phone, vehicle type (bicycle, motorbike, CNG, etc.), and your bKash payout account. Our team reviews and approves applications. Once approved, go online from your dashboard and start earning — you keep 80% of every fare.",
  },
  {
    q: "How does live tracking work?",
    a: "Once a rider is assigned, the order tracking page (/orders/[id]/track) shows their GPS location updating every few seconds via WebSocket. You can share the tracking link with anyone — it stops working automatically after delivery is confirmed.",
  },
  {
    q: "What if something goes wrong with my delivery?",
    a: "File a dispute from the order tracking page within 48 hours. Choose a category, describe the issue, and our admin team reviews within 24–48 hours. They can side with the customer, the rider, or dismiss. Resolution notices are sent to all parties.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-ink/8 bg-[#F6F7F5] py-20">
      <div className="mx-auto max-w-3xl px-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-route-green">
          FAQ
        </div>
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Frequently asked questions
        </h2>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-ink/10 bg-white transition hover:border-ink/20"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-black/[0.01]"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-ink">{f.q}</span>
                <svg
                  className={`ml-4 h-5 w-5 shrink-0 text-ink/40 transition-transform ${open === i ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open === i && (
                <div className="animate-fade-up px-5 pb-5 text-sm leading-relaxed text-ink/65">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink/50">
          Still have questions?{" "}
          <a href="/contact" className="font-semibold text-route-green underline underline-offset-2 hover:text-route-green-dark">
            Contact support →
          </a>
        </p>
      </div>
    </section>
  );
}
