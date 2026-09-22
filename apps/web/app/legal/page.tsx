import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Terms & Privacy — NagarGo",
  description: "NagarGo terms of service and privacy policy for customers, riders, and partners.",
};

export default function LegalPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-4xl font-bold text-ink">Terms &amp; Privacy</h1>
        <p className="mt-3 text-ink/60">Last updated: September 2026</p>

        <nav className="mt-8 flex gap-4 text-sm font-semibold">
          <a href="#terms" className="text-route-green underline">Terms of Service</a>
          <a href="#privacy" className="text-route-green underline">Privacy Policy</a>
        </nav>

        {/* Terms */}
        <section id="terms" className="mt-12">
          <h2 className="font-display text-2xl font-bold text-ink">Terms of Service</h2>

          <div className="mt-6 space-y-6 text-ink/80">
            <div>
              <h3 className="font-display font-bold">1. Service Description</h3>
              <p className="mt-2 leading-relaxed">
                NagarGo is a hyperlocal delivery platform operating in Rajshahi, Bangladesh. We connect
                customers with independent, ID-verified riders to facilitate the delivery of lawful goods
                and medicine within the city. NagarGo is a technology intermediary and does not
                itself perform delivery services.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">2. Eligibility</h3>
              <p className="mt-2 leading-relaxed">
                You must be at least 18 years old and a resident of Bangladesh to use NagarGo. By
                creating an account, you represent that all information you provide is accurate and
                up-to-date. Accounts may not be shared or transferred.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">3. Prohibited Items</h3>
              <p className="mt-2 leading-relaxed">
                The following must not be booked for delivery under any circumstances: illegal substances,
                weapons, counterfeit goods, hazardous materials, live animals, or any item prohibited under
                Bangladeshi law. NagarGo reserves the right to cancel orders and suspend accounts that
                violate this policy.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">4. Medicine Express</h3>
              <p className="mt-2 leading-relaxed">
                Medicine Express orders are subject to admin review before dispatch. Prescriptions are
                recorded for compliance purposes. NagarGo does not dispense or verify medication; we
                facilitate delivery only. Always consult a licensed medical professional before obtaining
                prescription medications.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">5. Payments</h3>
              <p className="mt-2 leading-relaxed">
                All fares are calculated server-side and are non-negotiable after order confirmation.
                Supported payment methods are shown at checkout. Disputed payments must be raised
                through the in-app dispute flow within 72 hours of delivery.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">6. Rider Terms</h3>
              <p className="mt-2 leading-relaxed">
                Riders are independent contractors, not employees of NagarGo. By registering, riders
                agree to carry only lawful items, maintain a valid NID, follow traffic laws, and treat
                customers respectfully. NagarGo may suspend or terminate a rider account for violations.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">7. Limitation of Liability</h3>
              <p className="mt-2 leading-relaxed">
                NagarGo&apos;s liability is limited to the delivery fare paid for a specific order. We are
                not liable for indirect, incidental, or consequential damages, including damage to goods
                in transit. Claims must be submitted within 48 hours via the dispute system.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">8. Modifications</h3>
              <p className="mt-2 leading-relaxed">
                NagarGo reserves the right to modify these terms at any time. Continued use of the
                platform after changes constitutes acceptance of the new terms.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="my-12 border-t border-ink/10" />

        {/* Privacy */}
        <section id="privacy">
          <h2 className="font-display text-2xl font-bold text-ink">Privacy Policy</h2>

          <div className="mt-6 space-y-6 text-ink/80">
            <div>
              <h3 className="font-display font-bold">1. Data We Collect</h3>
              <p className="mt-2 leading-relaxed">
                We collect name, phone number, email address, username, profile photo, and location at
                signup. During orders we collect pickup and destination addresses and live GPS location
                (riders only, during active deliveries). We collect payment transaction IDs and
                screenshots for verification purposes.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">2. How We Use Your Data</h3>
              <p className="mt-2 leading-relaxed">
                Your data is used to: authenticate your account, calculate delivery routes and pricing,
                dispatch riders, process and verify payments, and send in-app notifications. We do not
                sell your data to third parties.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">3. NID and Prescription Documents</h3>
              <p className="mt-2 leading-relaxed">
                Rider NID documents and customer prescription uploads are stored securely and accessible
                only to NagarGo administrators for verification and compliance purposes. These documents
                are never shared with third parties.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">4. Telegram Notifications</h3>
              <p className="mt-2 leading-relaxed">
                If you connect your Telegram account as a rider, your Telegram chat ID is stored to
                deliver order alerts. Order details sent to Telegram contain no sensitive personal
                information beyond your name and order ID.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">5. Data Retention</h3>
              <p className="mt-2 leading-relaxed">
                Order records, payment records, and audit logs are retained for a minimum of 5 years for
                legal and compliance purposes. Account data may be deleted upon written request, subject
                to retention requirements.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold">6. Contact</h3>
              <p className="mt-2 leading-relaxed">
                For data or privacy questions, contact us at{" "}
                <a href="mailto:privacy@nagargo.com" className="text-route-green underline">
                  privacy@nagargo.com
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
