'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/shared/logo';
import { Home, Navigation } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background-2 to-background-3" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>

        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative mx-auto mb-8 w-40 h-40">
          <svg viewBox="0 0 160 160" className="w-full h-full">
            <path d="M40,120 Q60,80 80,100 T140,60" stroke="#00D26A" strokeWidth="2" fill="none" strokeDasharray="6 6" opacity="0.4" />
            <circle cx="40" cy="120" r="6" fill="#00D26A" opacity="0.5" />
            <circle cx="140" cy="60" r="6" fill="#00D26A" opacity="0.5" />
            <motion.path d="M80,90 L80,70 M70,80 L90,80" stroke="#00D26A" strokeWidth="3" strokeLinecap="round" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
            <circle cx="80" cy="80" r="30" stroke="#00D26A" strokeWidth="1.5" fill="none" opacity="0.3" />
          </svg>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display), system-ui' }}>
          Looks like you took a wrong turn.
        </motion.h1>
        <p className="text-muted-foreground mb-8">The page you are looking for doesn&apos;t exist or has been moved.</p>

        <Link href="/" className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all glow-primary">
          <Home className="w-5 h-5" /> Go Home
        </Link>
      </div>
    </div>
  );
}
