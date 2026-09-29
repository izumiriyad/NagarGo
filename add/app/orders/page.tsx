'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Bike, Pill } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';

interface Order {
  id: string; order_id: string; service_type: string; status: string; total_fare: number;
  pickup_address: string; dropoff_address: string; created_at: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('orders').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
      setOrders(data as Order[] || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.service_type === filter);

  return (
    <SiteLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>My Orders</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {[{ id: 'all', label: 'All' }, { id: 'parcel', label: 'Parcel' }, { id: 'ride', label: 'Ride' }, { id: 'medicine', label: 'Medicine' }].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-4 h-9 rounded-md text-sm font-medium border shrink-0 transition-all ${filter === f.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/30'}`}>{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found</p>
            <Link href="/delivery" className="mt-4 inline-block text-sm text-primary hover:underline">Create your first order →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="block glass rounded-xl border border-border/60 p-4 hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {o.service_type === 'parcel' ? <Package className="w-5 h-5 text-primary shrink-0" /> : o.service_type === 'ride' ? <Bike className="w-5 h-5 text-info shrink-0" /> : <Pill className="w-5 h-5 text-warning shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{o.order_id}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.pickup_address} → {o.dropoff_address}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(o.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{formatCurrency(o.total_fare)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{o.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
