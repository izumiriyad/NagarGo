'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, MapPin, User } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/dashboard', icon: Package, label: 'Orders' },
  { href: '/track', icon: MapPin, label: 'Track' },
  { href: '/dashboard', icon: User, label: 'Account' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/rider/')) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/50 lg:hidden">
      <nav className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
