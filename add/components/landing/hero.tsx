'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { Package, Bike, Pill, UserPlus, ArrowRight, MapPin, Zap, Shield } from 'lucide-react';
import { MapAnimation } from '@/components/landing/map-animation';

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background-2 to-background-3" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Animated route SVG */}
      <svg className="absolute inset-0 w-full h-full -z-10 opacity-20" preserveAspectRatio="none">
        <motion.path
          d="M0,60% Q25%,40% 50%,55% T100%,45%"
          stroke="url(#routeGrad)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="10 10"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1, strokeDashoffset: [0, -40] }}
          transition={{ pathLength: { duration: 2 }, strokeDashoffset: { duration: 2, repeat: Infinity, ease: 'linear' } }}
        />
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D26A" stopOpacity="0" />
            <stop offset="50%" stopColor="#24F58A" stopOpacity="1" />
            <stop offset="100%" stopColor="#00D26A" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30"
            >
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-primary-bright" />
              </span>
              <span className="text-xs font-medium text-primary">{t('hero.status')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight"
              style={{ fontFamily: 'var(--font-display), system-ui' }}
            >
              <span className="text-foreground">Smartest and Most</span>
              <br />
              <span className="text-foreground">Trusted </span>
              <span className="text-gradient">Delivery</span>
              <br />
              <span className="text-foreground">and Riding Network</span>
              <br />
              <span className="text-muted-foreground text-3xl sm:text-4xl lg:text-5xl">of Bangladesh</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-lg"
            >
              {t('brand.secondary')} Send parcels, book rides, get medicines delivered — all with live tracking and OTP security.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/rider"
                className="group flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all glow-primary"
              >
                <UserPlus className="w-5 h-5" />
                {t('hero.becomeRider')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/delivery"
                className="flex items-center gap-2 px-6 h-12 rounded-md border border-border/60 hover:border-primary/40 glass text-foreground font-semibold transition-all"
              >
                <Package className="w-5 h-5 text-primary" />
                {t('hero.sendParcel')}
              </Link>
              <Link
                href="/ride"
                className="flex items-center gap-2 px-6 h-12 rounded-md border border-border/60 hover:border-primary/40 glass text-foreground font-semibold transition-all"
              >
                <Bike className="w-5 h-5 text-primary" />
                {t('hero.rideWithMe')}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                OTP Verified
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                Live Tracking
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                GPS Located
              </div>
            </motion.div>
          </div>

          {/* Right: Animated map + Floating cards */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <MapAnimation />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 gap-3"
            >
              <FloatingCard icon={Package} title="Parcel Delivery" subtitle="2,340+ delivered" delay={0} />
              <FloatingCard icon={Pill} title="Medicine Express" subtitle="Fast & secure" delay={1} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({
  icon: Icon,
  title,
  subtitle,
  delay,
}: {
  icon: typeof Package;
  title: string;
  subtitle: string;
  delay: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, delay }}
      className="glass rounded-lg p-4 border border-border/60 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
