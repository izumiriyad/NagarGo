'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Bike, Pill, MapPin, CreditCard, Navigation, Share2, Copy, Phone, CheckCircle, Loader2, XCircle, Clock } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/format';
import { toast } from 'sonner';

const statusFlow = ['requested', 'searching_rider', 'rider_assigned', 'rider_accepted', 'arriving_pickup', 'arrived_pickup', 'picked_up', 'in_transit', 'arriving_destination', 'arrived_destination', 'delivered', 'completed'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      setOrder(data);
      setLoading(false);
    })();
  }, [id]);

  const cancelOrder = useCallback(async () => {
    if (!order || !user) return;
    setCancelling(true);
    const { error } = await supabase.from('orders').update({ status: 'cancelled', cancelled_by: 'customer', cancelled_at: new Date().toISOString() }).eq('id', order.id).eq('customer_id', user.id);
    setCancelling(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Order cancelled');
    setOrder({ ...order, status: 'cancelled' });
  }, [order, user]);

  const copyTrackingLink = useCallback(() => {
    if (!order?.trip_id) return;
    const url = `${window.location.origin}/track/${order.trip_id}`;
    navigator.clipboard.writeText(url);
    toast.success('Tracking link copied');
  }, [order]);

  const shareLink = useCallback(async () => {
    if (!order?.trip_id) return;
    const url = `${window.location.origin}/track/${order.trip_id}`;
    if (navigator.share) { try { await navigator.share({ title: 'NagarGo Live Tracking', url }); } catch {} }
    else { navigator.clipboard.writeText(url); toast.success('Link copied'); }
  }, [order]);

  if (loading) return <SiteLayout><div className="max-w-2xl mx-auto px-4 py-20"><div className="h-64 rounded-xl bg-secondary/30 animate-pulse" /></div></SiteLayout>;

  if (!order) return <SiteLayout><div className="max-w-md mx-auto px-4 py-20 text-center"><XCircle className="w-12 h-12 text-destructive mx-auto mb-4" /><h1 className="text-xl font-bold">Order Not Found</h1><Link href="/orders" className="mt-4 inline-block text-primary hover:underline">Back to orders</Link></div></SiteLayout>;

  const isActive = !['completed', 'cancelled', 'rejected', 'expired'].includes(order.status);
  const currentStep = statusFlow.indexOf(order.status);

  return (
    <SiteLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">← Back to orders</Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-border/60 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {order.service_type === 'parcel' ? <Package className="w-6 h-6 text-primary" /> : order.service_type === 'ride' ? <Bike className="w-6 h-6 text-info" /> : <Pill className="w-6 h-6 text-warning" />}
              <div>
                <h1 className="text-lg font-bold">{order.order_id}</h1>
                <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${order.status === 'completed' ? 'bg-primary/15 text-primary' : order.status === 'cancelled' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Status timeline */}
          {isActive && currentStep >= 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between overflow-x-auto scrollbar-hide pb-2">
                {statusFlow.slice(0, 8).map((s, i) => (
                  <div key={s} className="flex items-center shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {i < currentStep ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    {i < 7 && <div className={`w-4 h-px ${i < currentStep ? 'bg-primary' : 'bg-border'}`} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Addresses */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0"><p className="text-xs text-muted-foreground">Pickup</p><p className="text-sm font-medium truncate">{order.pickup_address}</p>{order.pickup_contact_name && <p className="text-xs text-muted-foreground">{order.pickup_contact_name} · {order.pickup_contact_phone}</p>}</div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Navigation className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0"><p className="text-xs text-muted-foreground">Destination</p><p className="text-sm font-medium truncate">{order.dropoff_address}</p>{order.dropoff_contact_name && <p className="text-xs text-muted-foreground">{order.dropoff_contact_name} · {order.dropoff_contact_phone}</p>}</div>
            </div>
          </div>

          {/* Fare breakdown */}
          <div className="rounded-lg bg-secondary/40 border border-border/60 p-4 space-y-2 mb-6">
            <h3 className="text-sm font-semibold mb-2">Fare Breakdown</h3>
            <FareRow label="Base Fare" value={order.base_fare} />
            {order.distance_fare > 0 && <FareRow label={`Distance (${order.distance_km?.toFixed(1)} km)`} value={order.distance_fare} />}
            <FareRow label="Service Fee" value={order.service_fee} />
            {order.medicine_fee > 0 && <FareRow label="Medicine Fee" value={order.medicine_fee} />}
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between"><span className="font-semibold">Total</span><span className="text-lg font-bold text-primary">{formatCurrency(order.total_fare)}</span></div>
          </div>

          {/* Payment */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 mb-4">
            <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /><span className="text-sm">Payment: <span className="font-medium capitalize">{order.payment_method.replace(/_/g, ' ')}</span></span></div>
            <span className={`text-xs font-medium capitalize ${order.payment_status === 'verified' ? 'text-primary' : order.payment_status === 'rejected' ? 'text-destructive' : 'text-warning'}`}>{order.payment_status}</span>
          </div>

          {/* Actions */}
          {isActive && (
            <div className="grid grid-cols-2 gap-3">
              {order.trip_id && (
                <>
                  <button onClick={() => router.push(`/track/${order.trip_id}`)} className="flex items-center justify-center gap-2 px-4 h-11 rounded-md bg-primary/10 border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/20 transition-all">
                    <Navigation className="w-4 h-4" /> Track Live
                  </button>
                  <button onClick={shareLink} className="flex items-center justify-center gap-2 px-4 h-11 rounded-md border border-border/60 text-sm font-medium hover:border-primary/30 transition-all">
                    <Share2 className="w-4 h-4" /> Share Link
                  </button>
                </>
              )}
              {order.payment_method === 'bkash' && order.payment_status !== 'verified' && (
                <a href="https://nagar-go-payment.vercel.app/" target="_blank" rel="noopener noreferrer" className="col-span-2 flex items-center justify-center gap-2 px-4 h-11 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright transition-all">
                  <CreditCard className="w-4 h-4" /> Pay with bKash
                </a>
              )}
              <button onClick={cancelOrder} disabled={cancelling} className="col-span-2 flex items-center justify-center gap-2 px-4 h-11 rounded-md border border-destructive/30 text-destructive font-medium text-sm hover:bg-destructive/10 disabled:opacity-50 transition-all">
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </SiteLayout>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{formatCurrency(value)}</span></div>;
}
