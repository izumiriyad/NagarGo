'use client';

import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { RotateCcw } from 'lucide-react';

export default function RefundPage() {
  return (
    <SiteLayout>
      <PageHeader title="Refund Policy" subtitle="How refunds work at NagarGo" icon={<RotateCcw className="w-8 h-8 text-primary" />} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 prose prose-invert prose-sm">
        <h2>1. Refund Eligibility</h2>
        <p>Refunds may be requested in the following cases:</p>
        <ul>
          <li>Order cancelled before rider assignment.</li>
          <li>Payment made but service not delivered.</li>
          <li>Overpayment due to system error.</li>
          <li>Order rejected by all riders and expired.</li>
        </ul>

        <h2>2. Refund Process</h2>
        <p>To request a refund, create a support ticket with category "Refund Request" including your order ID and payment details. Our admin team will review and process eligible refunds.</p>

        <h2>3. Refund Statuses</h2>
        <ul>
          <li><strong>Requested:</strong> Your refund request has been submitted.</li>
          <li><strong>Approved:</strong> The refund has been approved for processing.</li>
          <li><strong>Processing:</strong> The refund is being sent to your account.</li>
          <li><strong>Refunded:</strong> The refund has been completed.</li>
          <li><strong>Rejected:</strong> The refund request was not eligible.</li>
        </ul>

        <h2>4. Refund Timeline</h2>
        <p>Approved refunds are processed within 3-5 business days. bKash refunds are sent to the original sender number.</p>

        <h2>5. Non-Refundable Cases</h2>
        <ul>
          <li>Completed deliveries where the item was successfully delivered.</li>
          <li>Cancellations after pickup has been completed.</li>
          <li>Payments for services already rendered.</li>
        </ul>

        <p className="text-muted-foreground text-xs mt-8">Last updated: September 2026</p>
      </div>
    </SiteLayout>
  );
}
