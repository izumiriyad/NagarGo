'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MapPin, Package, Bike, Pill, UserPlus, Search, LogIn, User, Shield, Rocket, Sun, Moon } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTheme } from '@/components/shared/theme-provider';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/delivery', icon: Package, key: 'nav.location', label: 'Location' },
  { href: '/medicine', icon: Pill, key: 'nav.medicine', label: 'Medicine Express' },
  { href: '/ride', icon: Bike, key: 'nav.ride', label: 'Ride with me' },
  { href: '/rider', icon: UserPlus, key: 'nav.becomeRider', label: 'Become a Rider' },
];

export function Header() {
  const { t } = useI18n();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'glass-strong border-b border-border/50 shadow-lg shadow-black/20' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-2 px-4 h-10 rounded-md text-sm font-medium transition-all',
                      active
                        ? 'text-primary bg-primary/10 border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{t(item.key)}</span>
                    {active && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-md border border-primary/30 -z-10"
                        transition={{ type: 'spring', duration: 0.4 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-md border border-border/60 hover:border-primary/40 hover:bg-secondary/40 transition-all"
                aria-label="Toggle day/night"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
              </button>

              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-md border border-border/60 hover:border-primary/40 hover:bg-secondary/40 transition-all"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              <Link
                href="/rider"
                className="hidden sm:flex items-center gap-1.5 px-3 h-10 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
              >
                <Rocket className="w-4 h-4" />
                <span>Become a Rider</span>
              </Link>

              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 h-10 rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 text-sm font-medium transition-all"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>

              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href={profile?.role === 'rider' ? '/rider/dashboard' : profile?.role === 'admin' ? '/admin' : '/dashboard'}
                    className="flex items-center gap-2 px-4 h-10 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={signOut}
                    className="px-3 h-10 rounded-md border border-border/60 text-muted-foreground hover:text-foreground text-sm transition-all"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="flex items-center px-4 h-10 rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 text-sm font-medium transition-all"
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center px-4 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-bright transition-all glow-primary"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-md border border-border/60 hover:border-primary/40 transition-all"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border/50"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search locations, services, orders..."
                    className="w-full pl-10 pr-4 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40 transition-colors"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] glass-strong border-l border-border z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-secondary/40"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-2">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 h-12 rounded-md text-sm font-medium transition-all',
                        pathname === item.href
                          ? 'bg-primary/10 border border-primary/30 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{t(item.key)}</span>
                    </Link>
                  </motion.div>
                ))}

                <div className="pt-4 border-t border-border/50 flex items-center gap-3">
                  <LanguageSwitcher />
                  <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-2 px-3 h-10 rounded-md border border-border/60 text-sm font-medium hover:border-primary/40 transition-all"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
                    {theme === 'dark' ? 'Day' : 'Night'}
                  </button>
                </div>

                <div className="pt-4 space-y-2">
                  <Link
                    href="/rider"
                    className="flex items-center justify-center gap-2 h-11 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm font-semibold"
                  >
                    <Rocket className="w-4 h-4" /> Become a Rider
                  </Link>
                  <Link
                    href="/admin"
                    className="flex items-center justify-center gap-2 h-11 rounded-md border border-border/60 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                  >
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                  {user ? (
                    <>
                      <Link
                        href={profile?.role === 'rider' ? '/rider/dashboard' : profile?.role === 'admin' ? '/admin' : '/dashboard'}
                        className="flex items-center justify-center gap-2 h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold"
                      >
                        <User className="w-4 h-4" /> Dashboard
                      </Link>
                      <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center h-11 rounded-md border border-border text-sm text-muted-foreground"
                      >
                        {t('auth.logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 h-11 rounded-md border border-border text-sm font-medium text-muted-foreground"
                      >
                        <LogIn className="w-4 h-4" /> {t('nav.signIn')}
                      </Link>
                      <Link
                        href="/register"
                        className="flex items-center justify-center h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold"
                      >
                        {t('nav.register')}
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
