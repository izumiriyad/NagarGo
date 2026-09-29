'use client';

import { useState, ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Bike, Package, CreditCard, Tag, MapPin, Star, Bell, Settings, FileText, DollarSign, Shield, Menu, X, LogOut, Pill, Route, Lock } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';

const ADMIN_PIN = '55555555';
const PIN_STORAGE_KEY = 'nagargo-admin-pin';

const sidebarItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/riders', icon: Bike, label: 'Riders' },
  { href: '/admin/orders', icon: Package, label: 'Orders' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { href: '/admin/bkash', icon: DollarSign, label: 'bKash Transactions' },
  { href: '/admin/pricing', icon: Tag, label: 'Pricing' },
  { href: '/admin/locations', icon: MapPin, label: 'Locations' },
  { href: '/admin/reviews', icon: Star, label: 'Reviews' },
  { href: '/admin/support', icon: FileText, label: 'Support' },
  { href: '/admin/payouts', icon: DollarSign, label: 'Payouts' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(PIN_STORAGE_KEY);
    if (stored === ADMIN_PIN) setPinUnlocked(true);
    setCheckingPin(false);
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      sessionStorage.setItem(PIN_STORAGE_KEY, ADMIN_PIN);
      setPinUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  if (checkingPin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pinUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-2">Admin PIN Required</h1>
          <p className="text-sm text-muted-foreground mb-6">Enter the admin PIN to access the control center.</p>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
              placeholder="Enter PIN"
              className={`w-full text-center text-2xl tracking-[0.5em] px-4 h-14 rounded-lg bg-secondary/40 border ${pinError ? 'border-destructive' : 'border-border/60'} text-sm outline-none focus:border-primary/40 font-bold`}
            />
            {pinError && <p className="text-xs text-destructive">Incorrect PIN. Try again.</p>}
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all">
              <Shield className="w-5 h-5" /> Unlock
            </button>
          </form>
          <Link href="/" className="inline-block mt-4 text-xs text-muted-foreground hover:text-foreground">Back to home</Link>
        </motion.div>
      </div>
    );
  }

  if (!user || (profile?.role !== 'admin' && !pinUnlocked)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Admin Access</h1>
          <p className="text-sm text-muted-foreground mb-6">Please login to access the admin dashboard.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-background-2 fixed inset-y-0 left-0 z-30">
        <div className="p-4 border-b border-border/50">
          <Logo />
          <span className="text-xs text-muted-foreground mt-2 block">Admin Control Center</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sidebarItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 px-3 h-11 rounded-md text-sm font-medium transition-all', active ? 'bg-primary/10 border border-primary/30 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent')}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/50">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 h-11 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-64 z-50 bg-background-2 border-r border-border/50 lg:hidden overflow-y-auto">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <Logo />
                <button onClick={() => setSidebarOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-secondary/40"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {sidebarItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={cn('flex items-center gap-3 px-3 h-11 rounded-md text-sm font-medium transition-all', pathname === item.href ? 'bg-primary/10 border border-primary/30 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent')}>
                    <item.icon className="w-5 h-5" /> {item.label}
                  </Link>
                ))}
                <button onClick={signOut} className="w-full flex items-center gap-3 px-3 h-11 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"><LogOut className="w-5 h-5" /> Logout</button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="lg:hidden glass-strong border-b border-border/50 sticky top-0 z-20">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-md border border-border/60"><Menu className="w-5 h-5" /></button>
            <Logo showText={false} />
            <div className="w-10" />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
