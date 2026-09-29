'use client';

import { motion } from 'framer-motion';
import { Navigation, Radio, Share2, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function LiveTrackingExplainer() {
  const { t } = useI18n();

  const features = [
    { icon: Radio, title: 'Real-time GPS', desc: 'Rider location updates every 3-5 seconds during active trips' },
    { icon: ShieldCheck, title: 'Secure Tracking Token', desc: 'Each trip has a unique, unguessable tracking link' },
    { icon: Clock, title: 'Auto-Expiry', desc: 'Tracking stops automatically when the trip ends' },
    { icon: Share2, title: 'Share with Anyone', desc: 'Copy or share your live tracking link with family' },
    { icon: Navigation, title: 'ETA Updates', desc: 'See estimated arrival time updated live' },
    { icon: MapPin, title: 'GPS Accuracy', desc: 'Location accuracy shown so you know the precision' },
  ];

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30 mb-4">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-primary-bright" />
            </span>
            <span className="text-xs font-medium text-primary">LIVE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-display), system-ui' }}>
            Live Trip Tracking
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            Every trip gets a secure, shareable tracking link. See your rider moving in real-time, know the ETA, and share with family — all from one link.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-lg p-4 border border-border/60"
              >
                <f.icon className="w-5 h-5 text-primary mb-2" />
                <h4 className="text-sm font-semibold mb-1">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tracking mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-xl border border-border/60 p-6 max-w-sm mx-auto w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">NagarGo</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary text-primary-foreground">LIVE</span>
            </div>
            <span className="text-xs text-muted-foreground">Updated 3s ago</span>
          </div>

          <div className="relative h-40 rounded-lg bg-secondary/40 border border-border/40 mb-4 overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-40" />
            <svg className="absolute inset-0 w-full h-full">
              <motion.path
                d="M20,140 Q60,80 100,100 T180,40"
                stroke="#00D26A"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, strokeDashoffset: [0, -20] }}
                transition={{ pathLength: { duration: 1.5 }, strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: 'linear' } }}
              />
            </svg>
            <motion.div
              animate={{ left: ['8%', '45%', '75%'], top: ['78%', '52%', '28%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-6 h-6"
            >
              <div className="relative">
                <span className="absolute inset-0 w-6 h-6 rounded-full bg-primary/30 animate-ping" />
                <span className="relative flex w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Navigation className="w-3 h-3 text-primary-foreground" />
                </span>
              </div>
            </motion.div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rider</span>
              <span className="font-medium">Karim H.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle</span>
              <span className="font-medium">Motorcycle · DHK-1234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-primary">On the way</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ETA</span>
              <span className="font-medium">8 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accuracy</span>
              <span className="font-medium">±12 meters</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
