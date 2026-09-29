'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Package, Bike, Pill, CheckCircle, XCircle, Loader2, MapPin, DollarSign } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function RiderRequestsPage() {
  const { user } = useAuth();
  const [rider, setRider] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: riderData } = await supabase.from('riders').select('*').eq('user_id', user.id).maybeSingle();
    setRider(riderData);
    if (!riderData) { setLoading(false); return; }

    const { data: available } = await supabase.from('orders').select('*').in('status', ['requested', 'searching_rider']).is('rider_id', null).order('created_at', { ascending: false }).limit(10);
    setAvailableOrders(available || []);

    const { data: mine } = await supabase.from('orders').select('*').eq('rider_id', riderData.id).in('status', ['rider_assigned', 'rider_accepted', 'arriving_pickup', 'arrived_pickup', 'picked_up', 'in_transit', 'arriving_destination', 'arrived_destination']).order('created_at', { ascending: false });
    setMyOrders(mine || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); const interval = setInterval(loadData, 5000); return () => clearInterval(interval); }, [loadData]);

  const acceptOrder = useCallback(async (orderId: string) => {
    if (!rider) return;
    setAccepting(orderId);
    const { data, error } = await supabase.from('orders').update({ status: 'rider_assigned', rider_id: rider.id }).eq('id', orderId).is('rider_id', null).select().single();
    if (!error && data) {
      await supabase.from('tracking_sessions').update({ rider_id: rider.id, status: 'rider_assigned', last_updated: new Date().toISOString() }).eq('order_id', orderId);
    }
    setAccepting(null);
    if (error || !data) { toast.error('Order was already accepted by another rider'); loadData(); return; }
    toast.success('Order accepted!');
    loadData();
  }, [rider, loadData]);

  if (!loading && !rider) {
    return <SiteLayout><div className="max-w-md mx-auto px-4 py-20 text-center"><h1 className="text-xl font-bold mb-4">Not a rider</h1><Link href="/rider" className="text-primary hover:underline">Register as a rider →</Link></div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Rider Requests</h1>

        {/* My active orders */}
        {myOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Active Orders ({myOrders.length})</h2>
            <div className="space-y-2">
              {myOrders.map((o) => (
                <Link key={o.id} href={`/rider/orders/${o.id}`} className="block glass rounded-xl border border-primary/30 p-4 hover:border-primary/50 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {o.service_type === 'parcel' ? <Package className="w-5 h-5 text-primary shrink-0" /> : o.service_type === 'ride' ? <Bike className="w-5 h-5 text-info shrink-0" /> : <Pill className="w-5 h-5 text-warning shrink-0" />}
                      <div className="min-w-0"><p className="text-sm font-medium">{o.order_id}</p><p className="text-xs text-muted-foreground truncate">{o.pickup_address} → {o.dropoff_address}</p></div>
                    </div>
                    <div className="text-right shrink-0"><p className="text-sm font-bold text-primary">{formatCurrency(o.rider_earning)}</p><p className="text-xs text-muted-foreground capitalize">{o.status.replace(/_/g, ' ')}</p></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Available orders */}
        <h2 className="text-lg font-semibold mb-3">Available Requests {rider?.is_online ? '' : '(Go online to receive)'}</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
        ) : availableOrders.length === 0 ? (
          <div className="text-center py-16 glass rounded-xl border border-border/60">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No new requests right now. Stay online to get notified!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableOrders.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {o.service_type === 'parcel' ? <Package className="w-6 h-6 text-primary" /> : o.service_type === 'ride' ? <Bike className="w-6 h-6 text-info" /> : <Pill className="w-6 h-6 text-warning" />}
                    <div>
                      <p className="text-sm font-bold capitalize">{o.service_type} · {o.order_id}</p>
                      <p className="text-xs text-muted-foreground">{o.distance_km?.toFixed(1) || 'N/A'} km</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{formatCurrency(o.rider_earning || 0)}</p>
                    <p className="text-xs text-muted-foreground">Your earning</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs mb-3">
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span className="truncate">{o.pickup_address}</span></div>
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-destructive shrink-0 mt-0.5" /><span className="truncate">{o.dropoff_address}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptOrder(o.id)} disabled={accepting === o.id || !rider?.is_online} className="flex-1 flex items-center justify-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all">
                    {accepting === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {accepting === o.id ? 'Accepting...' : 'Accept'}
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 h-10 rounded-md border border-border/60 text-sm font-medium text-muted-foreground hover:border-destructive/30 hover:text-destructive transition-all">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
