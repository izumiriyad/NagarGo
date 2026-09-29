'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/shared/logo';
import { Home, AlertTriangle } from 'lucide-react';

export default function Error() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background-2 to-background-3" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/10 rounded-full blur-[120px]" />
      </div>

      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>

        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
          <AlertTriangle className="w-20 h-20 text-warning mx-auto" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display), system-ui' }}>
          Something went wrong
        </motion.h1>
        <p className="text-muted-foreground mb-8">An unexpected error occurred. Please try again.</p>

        <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all mr-3">
          Try Again
        </button>
        <Link href="/" className="inline-flex items-center gap-2 px-6 h-12 rounded-md border border-border/60 text-foreground font-semibold hover:border-primary/40 transition-all">
          <Home className="w-5 h-5" /> Go Home
        </Link>
      </div>
    </div>
  );
}
