'use client';

import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <SiteLayout>
      <PageHeader title="Terms & Conditions" subtitle="The terms governing your use of NagarGo" icon={<FileText className="w-8 h-8 text-primary" />} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 prose prose-invert prose-sm">
        <h2>1. Acceptance of Terms</h2>
        <p>By using NagarGo, you agree to these terms and conditions. If you do not agree, please do not use our services.</p>

        <h2>2. Services</h2>
        <p>NagarGo provides parcel delivery, ride booking, and medicine express delivery services across Bangladesh. Services are subject to rider availability and location coverage.</p>

        <h2>3. User Responsibilities</h2>
        <ul>
          <li>Provide accurate information when creating orders.</li>
          <li>Ensure pickup and delivery contacts are available.</li>
          <li>Pay the agreed fare using the selected payment method.</li>
          <li>Do not send illegal, dangerous, or prohibited items.</li>
          <li>Treat riders and support staff with respect.</li>
        </ul>

        <h2>4. Order Cancellation</h2>
        <p>Orders can be cancelled before a rider is assigned. Cancellation after assignment may be subject to review. Cancellation reasons are recorded.</p>

        <h2>5. Payment</h2>
        <p>Payments can be made via cash, pay-to-rider, pay-to-admin, or manual bKash Send Money. bKash payments require manual verification of the transaction ID. Do not mark payments as complete without actual payment.</p>

        <h2>6. OTP Verification</h2>
        <p>Pickup and delivery are verified using OTP codes. Sharing OTPs with unauthorized persons is at your own risk.</p>

        <h2>7. Liability</h2>
        <p>NagarGo is not liable for damages to fragile items not properly packaged. We facilitate connections between customers and riders but are not responsible for items sent through the platform.</p>

        <h2>8. Account Suspension</h2>
        <p>NagarGo reserves the right to suspend accounts that violate these terms, engage in fraudulent behavior, or abuse the platform.</p>

        <h2>9. Changes to Terms</h2>
        <p>We may update these terms periodically. Continued use after changes constitutes acceptance.</p>

        <p className="text-muted-foreground text-xs mt-8">Last updated: September 2026</p>
      </div>
    </SiteLayout>
  );
}
