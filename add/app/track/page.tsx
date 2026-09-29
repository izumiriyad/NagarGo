'use client';

import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Navigation, Search, Copy, Share2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TrackPage() {
  const [tripId, setTripId] = useState('');

  const track = () => {
    if (!tripId.trim()) { toast.error('Please enter a Trip ID'); return; }
    window.location.href = `/track/${tripId.trim()}`;
  };

  return (
    <SiteLayout>
      <PageHeader title="Track Your Trip" subtitle="Enter your Trip ID to see live tracking of your active delivery or ride." icon={<Navigation className="w-8 h-8 text-primary" />} />

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="glass rounded-xl border border-border/60 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Trip ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && track()}
                placeholder="e.g. TRIP-2026-000001"
                className="w-full pl-10 pr-4 h-12 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <button onClick={track} className="w-full flex items-center justify-center gap-2 px-5 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all">
            <Navigation className="w-5 h-5" /> Track Now
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="glass rounded-lg border border-border/60 p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">Each trip has a unique, secure tracking token. Only active trips can be tracked.</p>
          </div>
          <div className="glass rounded-lg border border-border/60 p-4 flex items-center gap-3">
            <Copy className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">You can also copy the tracking link from your order details and share it with family.</p>
          </div>
          <div className="glass rounded-lg border border-border/60 p-4 flex items-center gap-3">
            <Share2 className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">Tracking links expire automatically when the trip ends.</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-primary hover:underline">View your orders →</Link>
        </div>
      </div>
    </SiteLayout>
  );
}
