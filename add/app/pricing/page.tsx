'use client';

import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Tag, Calculator, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { motion } from 'framer-motion';

const plans = [
  { zone: 'Rajshahi', baseFare: 40, perKm: 12, minFare: 50, serviceFee: 5, includedKm: 2 },
  { zone: 'Dhaka / Chattogram', baseFare: 50, perKm: 15, minFare: 60, serviceFee: 10, includedKm: 2 },
  { zone: 'Other Major Cities', baseFare: 45, perKm: 13, minFare: 55, serviceFee: 5, includedKm: 2 },
];

export default function PricingPage() {
  return (
    <SiteLayout>
      <PageHeader title="Transparent Pricing" subtitle="Know exactly what you pay before you ride or send a parcel." icon={<Tag className="w-8 h-8 text-primary" />} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {plans.map((p, i) => (
            <motion.div key={p.zone} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }} className={`glass rounded-xl p-6 border transition-colors ${i === 0 ? 'border-primary/40 glow-primary' : 'border-border/60 hover:border-primary/30'}`}>
              {i === 0 && <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary mb-3">Starter</span>}
              <h3 className="text-lg font-semibold mb-1">{p.zone}</h3>
              <p className="text-3xl font-bold text-primary mb-4">{formatCurrency(p.baseFare)}</p>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between"><span className="text-muted-foreground">Base Fare</span><span className="font-medium">{formatCurrency(p.baseFare)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Included Distance</span><span className="font-medium">{p.includedKm} km</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Per KM</span><span className="font-medium">{formatCurrency(p.perKm)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Minimum Fare</span><span className="font-medium">{formatCurrency(p.minFare)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Service Fee</span><span className="font-medium">{formatCurrency(p.serviceFee)}</span></li>
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="glass rounded-xl border border-border/60 p-6 mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4"><Calculator className="w-5 h-5 text-primary" /> Fare Formula</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground">Base Fare</span><span>+ Base Fare</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Distance Fare</span><span>+ (Distance - Included) × Per KM</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Waiting Fee</span><span>+ Waiting × Per Minute</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Service Fee</span><span>+ Service Fee</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Surcharge</span><span>+ Peak / Night / Zone</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>- Coupon Discount</span></div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between font-bold"><span>= Final Fare</span><span className="text-primary">Total</span></div>
          </div>
        </div>

        <div className="glass rounded-xl border border-border/60 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Commission Structure</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-secondary/40">
              <p className="text-3xl font-bold text-primary">80%</p>
              <p className="text-sm text-muted-foreground mt-1">Rider Earnings</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/40">
              <p className="text-3xl font-bold text-foreground">20%</p>
              <p className="text-sm text-muted-foreground mt-1">NagarGo Commission</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/10 p-4">
          <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">These are starter configuration values. Actual fares may vary based on distance, time, zone surcharges, and peak hours. NagarGo commission is configurable by admin.</p>
        </div>
      </div>
    </SiteLayout>
  );
}
