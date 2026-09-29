'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Package, Bike, Pill, MapPin, Bell, CreditCard, LifeBuoy, User, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/format';

interface Order {
  id: string; order_id: string; service_type: string; status: string; total_fare: number;
  pickup_address: string; dropoff_address: string; created_at: string;
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('orders').select('*').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(5);
      setOrders(data as Order[] || []);
      setLoadingOrders(false);
    })();
  }, [user]);

  if (!loading && !user) {
    return (
      <SiteLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Login</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to view your dashboard.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold">Login Now</Link>
        </div>
      </SiteLayout>
    );
  }

  const quickActions = [
    { href: '/delivery', icon: Package, label: 'Send Parcel', color: 'text-primary' },
    { href: '/ride', icon: Bike, label: 'Book Ride', color: 'text-info' },
    { href: '/medicine', icon: Pill, label: 'Medicine', color: 'text-warning' },
    { href: '/track', icon: MapPin, label: 'Track Trip', color: 'text-primary' },
  ];

  return (
    <SiteLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display), system-ui' }}>
            Welcome, {profile?.full_name || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">Manage your orders, rides, and account</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {quickActions.map((a, i) => (
            <motion.div key={a.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link href={a.href} className="block glass rounded-xl p-4 border border-border/60 hover:border-primary/30 transition-all group">
                <a.icon className={`w-6 h-6 ${a.color} mb-2`} />
                <p className="text-sm font-semibold">{a.label}</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-xl border border-border/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <Link href="/orders" className="text-xs text-primary hover:underline">View all →</Link>
              </div>
              {loadingOrders ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No orders yet. Start by sending a parcel or booking a ride!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {o.service_type === 'parcel' ? <Package className="w-5 h-5 text-primary shrink-0" /> : o.service_type === 'ride' ? <Bike className="w-5 h-5 text-info shrink-0" /> : <Pill className="w-5 h-5 text-warning shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{o.order_id}</p>
                          <p className="text-xs text-muted-foreground truncate">{o.pickup_address} → {o.dropoff_address}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <StatusBadge status={o.status} />
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(o.total_fare)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-xl border border-border/60 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Profile</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{profile?.full_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{profile?.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium capitalize">{profile?.role}</span></div>
              </div>
              <Link href="/account" className="mt-4 block text-center text-sm text-primary hover:underline">Edit profile →</Link>
            </div>

            <div className="glass rounded-xl border border-border/60 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Quick Links</h2>
              <div className="space-y-2">
                <Link href="/payments" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><CreditCard className="w-4 h-4" /> Payments</Link>
                <Link href="/locations" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><MapPin className="w-4 h-4" /> Saved Locations</Link>
                <Link href="/notifications" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Bell className="w-4 h-4" /> Notifications</Link>
                <Link href="/support" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><LifeBuoy className="w-4 h-4" /> Support</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'text-primary', delivered: 'text-primary', cancelled: 'text-destructive', rejected: 'text-destructive',
    requested: 'text-warning', searching_rider: 'text-warning', in_transit: 'text-info', picked_up: 'text-info',
  };
  const color = colors[status] || 'text-muted-foreground';
  return <span className={`text-xs font-medium ${color}`}>{status.replace(/_/g, ' ')}</span>;
}
