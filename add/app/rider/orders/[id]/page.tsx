'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Bike, Pill, MapPin, Navigation, KeyRound, CheckCircle, ArrowLeft, Loader2, Phone } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';

const riderActions = [
  { from: 'rider_assigned', to: 'rider_accepted', label: 'Accept Order', icon: CheckCircle },
  { from: 'rider_accepted', to: 'arriving_pickup', label: 'Going to Pickup', icon: Navigation },
  { from: 'arriving_pickup', to: 'arrived_pickup', label: 'Arrived at Pickup', icon: MapPin },
  { from: 'arrived_pickup', to: 'picked_up', label: 'Picked Up', icon: Package },
  { from: 'picked_up', to: 'in_transit', label: 'Start Transit', icon: Navigation },
  { from: 'in_transit', to: 'arrived_destination', label: 'Arrived at Destination', icon: MapPin },
  { from: 'arrived_destination', to: 'delivered', label: 'Delivered', icon: CheckCircle },
  { from: 'delivered', to: 'completed', label: 'Complete Trip', icon: CheckCircle },
];

export default function RiderOrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: riderData } = await supabase.from('riders').select('*').eq('user_id', user.id).maybeSingle();
      setRider(riderData);
      const { data: orderData } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      setOrder(orderData);
      setLoading(false);
    })();
  }, [id, user]);

  const performAction = useCallback(async (toStatus: string) => {
    if (!order) return;
    setActing(true);
    const updates: Record<string, unknown> = { status: toStatus, updated_at: new Date().toISOString() };
    if (toStatus === 'completed') updates.completed_at = new Date().toISOString();

    const { error } = await supabase.from('orders').update(updates).eq('id', order.id);
    if (!error) {
      await supabase.from('tracking_sessions').update({ status: toStatus, last_updated: new Date().toISOString() }).eq('order_id', order.id);
    }
    setActing(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status updated to ${toStatus.replace(/_/g, ' ')}`);
    setOrder({ ...order, status: toStatus });
  }, [order]);

  const verifyOtp = useCallback(async () => {
    if (!order || !otpInput) { toast.error('Please enter the OTP'); return; }
    if (order.status === 'arrived_pickup' && otpInput === order.pickup_otp) {
      await performAction('picked_up');
      setShowOtp(false); setOtpInput('');
    } else if (order.status === 'arrived_destination' && otpInput === order.delivery_otp) {
      await performAction('delivered');
      setShowOtp(false); setOtpInput('');
    } else {
      toast.error('Invalid OTP. Please check with the customer.');
    }
  }, [order, otpInput, performAction]);

  if (loading) return <SiteLayout><div className="max-w-2xl mx-auto px-4 py-20"><div className="h-64 rounded-xl bg-secondary/30 animate-pulse" /></div></SiteLayout>;
  if (!order) return <SiteLayout><div className="max-w-md mx-auto px-4 py-20 text-center"><h1 className="text-xl font-bold">Order not found</h1><Link href="/rider/requests" className="mt-4 inline-block text-primary hover:underline">← Back to requests</Link></div></SiteLayout>;

  const currentAction = riderActions.find((a) => a.from === order.status);
  const isActive = !['completed', 'cancelled', 'rejected'].includes(order.status);

  return (
    <SiteLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <Link href="/rider/requests" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to requests</Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-border/60 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {order.service_type === 'parcel' ? <Package className="w-6 h-6 text-primary" /> : order.service_type === 'ride' ? <Bike className="w-6 h-6 text-info" /> : <Pill className="w-6 h-6 text-warning" />}
              <div><h1 className="text-lg font-bold">{order.order_id}</h1><p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p></div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize bg-warning/15 text-warning">{order.status.replace(/_/g, ' ')}</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"><MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" /><div><p className="text-xs text-muted-foreground">Pickup</p><p className="text-sm font-medium">{order.pickup_address}</p>{order.pickup_contact_name && <p className="text-xs text-muted-foreground">{order.pickup_contact_name} · {order.pickup_contact_phone}</p>}</div></div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"><Navigation className="w-5 h-5 text-primary shrink-0 mt-0.5" /><div><p className="text-xs text-muted-foreground">Destination</p><p className="text-sm font-medium">{order.dropoff_address}</p>{order.dropoff_contact_name && <p className="text-xs text-muted-foreground">{order.dropoff_contact_name} · {order.dropoff_contact_phone}</p>}</div></div>
          </div>

          <div className="rounded-lg bg-secondary/40 border border-border/60 p-4 mb-6">
            <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Your Earning</span><span className="text-xl font-bold text-primary">{formatCurrency(order.rider_earning)}</span></div>
            <div className="flex justify-between items-center mt-1"><span className="text-xs text-muted-foreground">Total Fare (incl. commission)</span><span className="text-sm">{formatCurrency(order.total_fare)}</span></div>
          </div>

          {isActive && currentAction && (
            <div className="space-y-3">
              {(order.status === 'arrived_pickup' || order.status === 'arrived_destination') ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                    <p className="text-sm font-medium flex items-center gap-2 mb-2"><KeyRound className="w-4 h-4 text-primary" /> OTP Verification Required</p>
                    <p className="text-xs text-muted-foreground mb-3">Ask the {order.status === 'arrived_pickup' ? 'sender' : 'receiver'} for the 4-digit OTP code.</p>
                    <div className="flex gap-2">
                      <input type="text" inputMode="numeric" maxLength={4} value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))} placeholder="0000" className="flex-1 px-3 h-11 rounded-md bg-secondary/40 border border-border/60 text-center text-lg font-bold tracking-widest outline-none focus:border-primary/40" />
                      <button onClick={verifyOtp} disabled={acting} className="flex items-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright disabled:opacity-50 transition-all">
                        {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Verify
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => performAction(currentAction.to)} disabled={acting} className="w-full flex items-center justify-center gap-2 px-5 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all">
                  {acting ? <Loader2 className="w-5 h-5 animate-spin" /> : <currentAction.icon className="w-5 h-5" />}
                  {acting ? 'Updating...' : currentAction.label}
                </button>
              )}
            </div>
          )}

          {order.status === 'completed' && (
            <div className="text-center py-4"><CheckCircle className="w-12 h-12 text-primary mx-auto mb-2" /><p className="font-semibold">Trip Completed</p></div>
          )}
        </motion.div>
      </div>
    </SiteLayout>
  );
}
