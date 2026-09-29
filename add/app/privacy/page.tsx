'use client';

import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <SiteLayout>
      <PageHeader title="Privacy Policy" subtitle="How NagarGo collects, uses, and protects your data" icon={<Shield className="w-8 h-8 text-primary" />} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 prose prose-invert prose-sm">
        <h2>1. Information We Collect</h2>
        <p>NagarGo collects the following information to provide our delivery and ride services:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, phone number, email address, and password (hashed).</li>
          <li><strong>Location Data:</strong> GPS coordinates when you grant permission, for pickup/drop-off and live tracking.</li>
          <li><strong>Order Information:</strong> Pickup and delivery addresses, contact details, package details.</li>
          <li><strong>Payment Information:</strong> bKash transaction IDs and sender numbers (for manual verification).</li>
          <li><strong>Rider Documents:</strong> NID, driving license, vehicle registration (for verification purposes).</li>
          <li><strong>Prescription Documents:</strong> Uploaded prescriptions for medicine delivery (stored privately).</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To create and manage your account.</li>
          <li>To process and deliver your orders and rides.</li>
          <li>To provide live tracking of active trips.</li>
          <li>To verify payments and process payouts to riders.</li>
          <li>To communicate with you about your orders.</li>
          <li>To maintain security and prevent fraud.</li>
        </ul>

        <h2>3. GPS and Location Privacy</h2>
        <p>Location access is only requested when needed for placing orders or tracking. Rider location is only shared during active trips and stops when the trip ends. We do not continuously track customers or riders when no active trip is in progress.</p>

        <h2>4. Data Security</h2>
        <p>Passwords are hashed using industry-standard algorithms. Sensitive documents (prescriptions, NID) are stored in private storage and are not publicly accessible. OTPs are hashed and expire after a short duration. We never store plaintext passwords, OTPs, or API keys.</p>

        <h2>5. Data Retention</h2>
        <p>Live tracking data is disabled after trip completion. Location history is minimized. We retain only operational and audit data as required.</p>

        <h2>6. Your Rights</h2>
        <p>You can request account deletion, view your data, and manage your saved locations from your dashboard. Contact support for data-related requests.</p>

        <h2>7. Cookies</h2>
        <p>We use essential cookies for authentication and session management. We do not use tracking cookies for advertising.</p>

        <h2>8. Contact</h2>
        <p>For privacy concerns, contact us at <a href="https://t.me/SouraksPizzaPro">@SouraksPizzaPro</a> on Telegram.</p>
        <p className="text-muted-foreground text-xs mt-8">Last updated: September 2026</p>
      </div>
    </SiteLayout>
  );
}
