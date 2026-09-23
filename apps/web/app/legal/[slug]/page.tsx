import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

const pages: Record<string, { title: string; meta: string; sections: { heading: string; body: string }[] }> = {
  terms: {
    title: "Terms of Service",
    meta: "NagarGo Terms of Service — understand the rules, rights and responsibilities for using our delivery platform.",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing or using the NagarGo platform (website, mobile app, or APIs), you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform. NagarGo is operated by NagarGo Technologies, based in Rajshahi, Bangladesh.",
      },
      {
        heading: "2. Services",
        body: "NagarGo provides a hyperlocal delivery platform connecting Customers (senders) with independent Riders (couriers) for the delivery of lawful goods within Rajshahi city. NagarGo acts as an intermediary and is not a logistics company. The delivery contract is between the Customer and the Rider.",
      },
      {
        heading: "3. Eligibility",
        body: "You must be at least 18 years old and capable of entering into a legally binding agreement under Bangladeshi law to use this platform. By registering, you confirm these requirements are met.",
      },
      {
        heading: "4. Account Responsibilities",
        body: "You are responsible for maintaining the confidentiality of your account credentials. You must not share your account, OTP codes, or access tokens with others. NagarGo will never ask for your password via phone or email.",
      },
      {
        heading: "5. Prohibited Items",
        body: "You may not use NagarGo to transport weapons, controlled substances (narcotics), counterfeit goods, hazardous materials, live animals, or any item prohibited under Bangladeshi law. Violations may result in immediate account termination and reporting to law enforcement.",
      },
      {
        heading: "6. Pricing and Payments",
        body: "Delivery fees are calculated based on distance, item category, and time of day. All prices are in Bangladeshi Taka (৳). Surcharges apply during peak hours and for emergency deliveries. NagarGo reserves the right to update the pricing configuration at any time.",
      },
      {
        heading: "7. Cancellations and Refunds",
        body: "Orders can be cancelled before a rider is dispatched at no charge. After pickup, cancellations must be arranged via customer support. Refund eligibility depends on the stage of the order and payment method used. Disputes are reviewed by the admin team within 24 hours.",
      },
      {
        heading: "8. Rider Relationship",
        body: "Riders are independent contractors, not employees of NagarGo. NagarGo is not liable for acts or omissions of Riders. However, NagarGo maintains a rating and trust system, and may suspend or permanently ban Riders for misconduct.",
      },
      {
        heading: "9. Liability Limitation",
        body: "NagarGo's liability for any claim arising from a delivery is limited to the delivery fee paid. NagarGo is not liable for consequential, indirect, or punitive damages. We strongly recommend insurance for high-value items.",
      },
      {
        heading: "10. Governing Law",
        body: "These Terms are governed by the laws of the People's Republic of Bangladesh. Disputes shall be resolved by the competent courts of Rajshahi, Bangladesh.",
      },
      {
        heading: "11. Changes to Terms",
        body: "NagarGo reserves the right to modify these Terms at any time. Users will be notified of significant changes via in-app notification. Continued use after notification constitutes acceptance.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    meta: "NagarGo Privacy Policy — how we collect, use, and protect your personal data.",
    sections: [
      {
        heading: "1. Data We Collect",
        body: "We collect: name, phone number, email address, profile photo, and approximate location when you register. During deliveries, we collect precise GPS location from Riders and route information. For payments, we collect transaction references (not full payment credentials). For Medicine Express, we collect prescription photos and medicine order details.",
      },
      {
        heading: "2. How We Use Your Data",
        body: "Your data is used to: operate and improve the delivery platform; match orders with available Riders; send in-app and Telegram notifications; verify identity and prevent fraud; process payment disputes; comply with legal obligations under Bangladeshi law.",
      },
      {
        heading: "3. Data Sharing",
        body: "We share your name and phone with the assigned Rider for delivery coordination. We do not sell your personal data to third parties. We may share data with law enforcement if required by court order or applicable law.",
      },
      {
        heading: "4. Data Storage",
        body: "Your data is stored on secure cloud infrastructure. Profile photos and NID documents are stored on Cloudinary CDN. Location data is retained for 30 days after delivery completion. You may request deletion of your account and data at any time.",
      },
      {
        heading: "5. Security",
        body: "We use HTTPS, JWT-based authentication, bcrypt password hashing, and role-based access control. OTP codes expire after 10 minutes and are invalidated after use. Rider NID documents are only accessible to admin users.",
      },
      {
        heading: "6. Your Rights",
        body: "You have the right to access, correct, and delete your personal data. To exercise these rights, contact us at support@nagargo.com or via WhatsApp. We will respond within 14 business days.",
      },
      {
        heading: "7. Cookies",
        body: "NagarGo does not use tracking or advertising cookies. A minimal session cookie may be used for authentication purposes. The app uses browser localStorage to store your access token — clearing this logs you out.",
      },
      {
        heading: "8. Changes to this Policy",
        body: "We may update this Privacy Policy to reflect changes in our practices or legal requirements. You will be notified of material changes via in-app notification.",
      },
    ],
  },
  prohibited: {
    title: "Prohibited Items Policy",
    meta: "Items that cannot be transported using the NagarGo delivery platform.",
    sections: [
      {
        heading: "Absolute Prohibitions",
        body: "The following may never be transported via NagarGo under any circumstances: firearms, ammunition, explosives; controlled substances and narcotics; human remains or body parts; live animals; counterfeit currency or documents; material that is illegal under Bangladeshi law.",
      },
      {
        heading: "Conditional Items",
        body: "Prescription medicine requires use of the Medicine Express service, which includes admin review. Alcohol is not supported. Items with a declared value over ৳50,000 should be declared and may require additional verification.",
      },
      {
        heading: "Enforcement",
        body: "NagarGo reserves the right to refuse, cancel, or report any order suspected of containing prohibited items. Riders are not obligated to transport items that appear suspicious and may report them.",
      },
    ],
  },
  medicine: {
    title: "Medicine Delivery Policy",
    meta: "How NagarGo's Medicine Express service handles prescription and over-the-counter medicine delivery.",
    sections: [
      {
        heading: "How It Works",
        body: "Medicine Express allows customers to order medicine from a specified pharmacy in Rajshahi. The order is reviewed by a NagarGo admin before a Rider is dispatched. A prescription photo can be uploaded for controlled medicines.",
      },
      {
        heading: "Admin Review",
        body: "Every Medicine Express order is manually reviewed by a NagarGo admin. This is to verify the pharmacy, medicine list, and prescription validity before dispatch. Review typically takes 15–60 minutes during operating hours.",
      },
      {
        heading: "Disclaimers",
        body: "NagarGo is not a pharmacy or healthcare provider. We do not verify the accuracy of prescriptions or the suitability of medicines for any individual. Customers are solely responsible for ensuring they order the correct medicines. NagarGo is not liable for any health outcomes.",
      },
    ],
  },
  refunds: {
    title: "Refund & Dispute Policy",
    meta: "How NagarGo handles cancellations, refunds, and delivery disputes.",
    sections: [
      {
        heading: "Cancellations",
        body: "Orders can be cancelled without charge before a Rider accepts the assignment. After a Rider accepts, a ৳20 cancellation fee may apply. Cancellations are not permitted after the item has been picked up.",
      },
      {
        heading: "Filing a Dispute",
        body: "Disputes can be filed from the order tracking page within 48 hours of delivery. Select the issue category (item damaged, not delivered, wrong item, etc.) and provide a description. The admin team reviews within 24 hours.",
      },
      {
        heading: "Refunds",
        body: "Approved refunds for Cash-on-Delivery orders are settled at the admin's discretion. bKash refunds are processed within 3–5 business days. NagarGo's maximum liability per order is the delivery fee paid, not the item value.",
      },
    ],
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = pages[params.slug];
  if (!p) return { title: "Policy — NagarGo" };
  return { title: `${p.title} — NagarGo`, description: p.meta };
}

export default function Legal({ params }: { params: { slug: string } }) {
  const p = pages[params.slug];

  if (!p) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-6xl">📄</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Policy not found</h1>
          <a href="/legal/terms" className="mt-6 inline-block text-sm font-semibold text-route-green underline">
            View Terms of Service →
          </a>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-16">
        {/* Header */}
        <div className="mb-12">
          <a href="/" className="text-sm font-semibold text-ink/40 hover:text-ink/70 transition-colors">← NagarGo</a>
          <div className="mt-4 text-xs font-bold uppercase tracking-widest text-green-600">Legal</div>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">{p.title}</h1>
          <p className="mt-3 text-ink/50 text-sm">
            Last reviewed: September 2026 · Governed by the laws of Bangladesh
          </p>
        </div>

        {/* Legal nav */}
        <div className="mb-10 flex flex-wrap gap-2">
          {Object.entries(pages).map(([slug, pg]) => (
            <a
              key={slug}
              href={`/legal/${slug}`}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                slug === params.slug
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 text-ink/60 hover:border-ink/30"
              }`}
            >
              {pg.title}
            </a>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {p.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-lg font-bold text-ink">{s.heading}</h2>
              <p className="mt-2 leading-relaxed text-ink/70">{s.body}</p>
            </section>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 rounded-2xl bg-black/5 p-5 text-sm text-ink/50 leading-relaxed">
          <strong className="text-ink/70">Template notice:</strong> These pages contain placeholder legal text that reflects NagarGo&apos;s operational practices. They must be reviewed and finalized by qualified local legal professionals licensed in Bangladesh before production launch.
        </div>

        {/* Contact */}
        <div className="mt-8 border-t border-ink/10 pt-8">
          <p className="text-sm text-ink/50">
            Questions about these policies? Contact us at{" "}
            <a href="mailto:support@nagargo.com" className="font-semibold text-route-green underline">
              support@nagargo.com
            </a>{" "}
            or via{" "}
            <a href="https://wa.me/8801683772714" target="_blank" rel="noopener noreferrer" className="font-semibold text-route-green underline">
              WhatsApp
            </a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
