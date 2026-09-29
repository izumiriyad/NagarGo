'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 group', className)} aria-label="NagarGo Home">
      <div className="relative">
        <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#050806" stroke="#00D26A" strokeOpacity="0.3" strokeWidth="1"/>
          <path d="M12 28V12L28 28V12" stroke="#00D26A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#24F58A] transition-colors"/>
          <circle cx="28" cy="12" r="3" fill="#24F58A" className="group-hover:animate-pulse"/>
          <path d="M8 20L12 20" stroke="#16E17A" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        </svg>
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity"/>
      </div>
      {showText && (
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display), system-ui' }}>
          <span className="text-white">Nagar</span>
          <span className="text-primary">Go</span>
        </span>
      )}
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('w-10 h-10', className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#050806" stroke="#00D26A" strokeOpacity="0.3" strokeWidth="1"/>
      <path d="M12 28V12L28 28V12" stroke="#00D26A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="28" cy="12" r="3" fill="#24F58A"/>
    </svg>
  );
}
