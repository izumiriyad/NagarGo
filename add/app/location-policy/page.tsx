'use client';

import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { MapPin } from 'lucide-react';

export default function LocationPolicyPage() {
  return (
    <SiteLayout>
      <PageHeader title="Location & GPS Privacy Policy" subtitle="How we handle your location data" icon={<MapPin className="w-8 h-8 text-primary" />} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 prose prose-invert prose-sm">
        <h2>1. When We Request Location</h2>
        <p>NagarGo requests your GPS location only when you:</p>
        <ul>
          <li>Create an order (to set pickup/drop-off location).</li>
          <li>Track an active trip (to show your position relative to the rider).</li>
          <li>Register as a rider (to verify your operating zone).</li>
        </ul>
        <p>We never request location without your explicit action. You can deny location permission at any time.</p>

        <h2>2. What We Store</h2>
        <ul>
          <li>Pickup and drop-off coordinates for your orders.</li>
          <li>Rider GPS coordinates during active trips (updated every 3-5 seconds).</li>
          <li>GPS accuracy readings to show data quality.</li>
          <li>Timestamps of location updates.</li>
        </ul>

        <h2>3. What We Do NOT Store</h2>
        <ul>
          <li>Continuous location history when no trip is active.</li>
          <li>Rider location when they are offline.</li>
          <li>Customer location outside of order creation.</li>
        </ul>

        <h2>4. Live Tracking Access</h2>
        <p>Each active trip has a unique, unguessable tracking token. Only people with the link can view the tracking. Tracking links expire automatically when the trip ends. No JWT or sensitive data is placed in tracking URLs.</p>

        <h2>5. Location Data Retention</h2>
        <p>Live tracking data is disabled after trip completion. We retain only the final delivery coordinates for order records. Precise real-time location is not retained indefinitely.</p>

        <h2>6. Your Control</h2>
        <p>You can manage location permissions in your browser or device settings. Denying location access will not prevent you from using NagarGo — you can manually enter addresses instead.</p>

        <p className="text-muted-foreground text-xs mt-8">Last updated: September 2026</p>
      </div>
    </SiteLayout>
  );
}
