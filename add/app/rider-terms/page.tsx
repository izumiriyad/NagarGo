'use client';

import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Bike } from 'lucide-react';

export default function RiderTermsPage() {
  return (
    <SiteLayout>
      <PageHeader title="Rider Terms" subtitle="Terms and conditions for NagarGo riders" icon={<Bike className="w-8 h-8 text-primary" />} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 prose prose-invert prose-sm">
        <h2>1. Rider Eligibility</h2>
        <p>To become a NagarGo rider, you must:</p>
        <ul>
          <li>Be at least 18 years old.</li>
          <li>Hold a valid driving license for your vehicle type.</li>
          <li>Provide a valid NID (National ID).</li>
          <li>Have a registered vehicle with valid registration.</li>
          <li>Have a bKash account for receiving payouts.</li>
        </ul>

        <h2>2. Commission Structure</h2>
        <p>By default, riders earn 80% of the total fare and NagarGo retains a 20% commission. These rates are configurable by the admin and may change with notice.</p>

        <h2>3. Rider Responsibilities</h2>
        <ul>
          <li>Accept only orders you can fulfill.</li>
          <li>Arrive at pickup locations on time.</li>
          <li>Verify pickup and delivery with OTP codes.</li>
          <li>Maintain professional behavior with customers.</li>
          <li>Keep your vehicle in safe working condition.</li>
          <li>Follow all traffic laws and regulations.</li>
        </ul>

        <h2>4. Earnings and Payouts</h2>
        <p>Earnings are tracked per order. Available earnings can be withdrawn via payout requests to your bKash account. Pending earnings are held until the order is fully completed.</p>

        <h2>5. Account Status</h2>
        <p>Rider accounts can be in the following states: Submitted, Under Review, Document Review, Approved, Rejected, or Suspended. NagarGo reserves the right to suspend riders for violations.</p>

        <h2>6. Location Sharing</h2>
        <p>Riders share their GPS location during active trips for live tracking. Location sharing stops when the trip ends. Riders can go offline to stop receiving new requests.</p>

        <h2>7. Document Privacy</h2>
        <p>Your NID, license, and vehicle documents are stored securely and used only for verification. They are not shared with customers or made public.</p>

        <p className="text-muted-foreground text-xs mt-8">Last updated: September 2026</p>
      </div>
    </SiteLayout>
  );
}
