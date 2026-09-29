'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Package, Bike, Pill, DollarSign, CheckCircle, XCircle, Clock, Power, Star, Navigation, Copy, Upload, FileText, MessageCircle, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ApprovalPopup } from '@/components/shared/approval-popup';
import { notifyTelegramRiderFee } from '@/lib/telegram';

export default function RiderDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rider, setRider] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ todayTrips: 0, todayEarnings: 0, totalTrips: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [popup, setPopup] = useState<{ show: boolean; type: 'approved' | 'rejected'; reason?: string | null }>({ show: false, type: 'approved' });
  const prevStatusRef = useRef<string | null>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeTrxId, setFeeTrxId] = useState('');
  const [feeSenderBkash, setFeeSenderBkash] = useState('');
  const [feeScreenshot, setFeeScreenshot] = useState<File | null>(null);
  const [feeSubmitting, setFeeSubmitting] = useState(false);

  const today = new Date();
  const maintenancePaidUntil = rider?.maintenance_fee_paid_until ? new Date(rider.maintenance_fee_paid_until) : null;
  const maintenanceExpired = !maintenancePaidUntil || maintenancePaidUntil < today;
  const nextDueDate = maintenancePaidUntil ? new Date(maintenancePaidUntil) : null;
  if (nextDueDate) nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: riderData } = await supabase.from('riders').select('*').eq('user_id', user.id).maybeSingle();
    setRider(riderData);
    if (!riderData) { setLoading(false); return; }

    // Check for status change
    if (prevStatusRef.current !== null && prevStatusRef.current !== riderData.status) {
      if (riderData.status === 'approved') {
        setPopup({ show: true, type: 'approved', reason: null });
      } else if (riderData.status === 'rejected') {
        setPopup({ show: true, type: 'rejected', reason: riderData.rejection_reason });
      }
    }
    prevStatusRef.current = riderData.status;

    if (riderData.status !== 'approved') { setLoading(false); return; }

    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('rider_id', riderData.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setOrders(orderData || []);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const completedToday = (orderData || []).filter((o) => o.status === 'completed' && o.completed_at && new Date(o.completed_at) >= today);
    setStats({
      todayTrips: completedToday.length,
      todayEarnings: completedToday.reduce((sum, o) => sum + (o.rider_earning || 0), 0),
      totalTrips: riderData.total_trips || 0,
      totalEarnings: riderData.total_earnings || 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime subscription for rider status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rider-status-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'riders', filter: `user_id=eq.${user.id}` },
        () => { loadData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadData]);

  const toggleOnline = useCallback(async () => {
    if (!rider) return;
    setToggling(true);
    const { error } = await supabase.from('riders').update({ is_online: !rider.is_online }).eq('id', rider.id);
    setToggling(false);
    if (error) { toast.error(error.message); return; }
    setRider({ ...rider, is_online: !rider.is_online });
    toast.success(rider.is_online ? 'You are now offline' : 'You are now online');
  }, [rider]);

  if (!authLoading && !user) {
    return <SiteLayout><div className="max-w-md mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold mb-4">Please Login</h1><Link href="/login" className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold">Login</Link></div></SiteLayout>;
  }

  if (!loading && !rider) {
    return <SiteLayout><div className="max-w-md mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold mb-4">Become a Rider</h1><p className="text-muted-foreground mb-6">You haven't registered as a rider yet.</p><Link href="/rider" className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold">Register Now</Link></div></SiteLayout>;
  }

  if (!loading && rider && rider.status !== 'approved') {
    return (
      <SiteLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-warning" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">Application Under Review</h1>
          <p className="text-muted-foreground mb-6">Your rider application status: <span className="font-semibold capitalize text-warning">{rider.status.replace(/_/g, ' ')}</span>. We will notify you once approved.</p>
          {rider.status === 'rejected' && rider.rejection_reason && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-6 text-left">
              <p className="text-xs font-medium text-destructive mb-1">Rejection Reason:</p>
              <p className="text-sm text-muted-foreground">{rider.rejection_reason}</p>
            </div>
          )}
        </div>
        <ApprovalPopup
          show={popup.show}
          type={popup.type}
          reason={popup.reason}
          onClose={() => setPopup({ show: false, type: popup.type })}
        />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display), system-ui' }}>Rider Dashboard</h1>
            <p className="text-muted-foreground mt-1">{profile?.full_name}</p>
          </div>
          <button onClick={toggleOnline} disabled={toggling} className={`flex items-center gap-2 px-5 h-12 rounded-md font-semibold transition-all ${rider?.is_online ? 'bg-primary text-primary-foreground glow-primary' : 'border border-border/60 text-muted-foreground'}`}>
            <Power className="w-5 h-5" />
            {rider?.is_online ? 'Online' : 'Offline'}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard icon={CheckCircle} label="Today's Trips" value={String(stats.todayTrips)} color="text-primary" />
          <StatCard icon={DollarSign} label="Today's Earnings" value={formatCurrency(stats.todayEarnings)} color="text-primary" />
          <StatCard icon={Package} label="Total Trips" value={String(stats.totalTrips)} color="text-info" />
          <StatCard icon={DollarSign} label="Total Earned" value={formatCurrency(stats.totalEarnings)} color="text-info" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-xl border border-border/60 p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Earnings</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-bold text-primary">{formatCurrency(rider?.available_earnings || 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="font-medium">{formatCurrency(rider?.pending_earnings || 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Already Paid</span><span className="font-medium">{formatCurrency(rider?.paid_earnings || 0)}</span></div>
              <div className="h-px bg-border" />
              <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-medium flex items-center gap-1"><Star className="w-3.5 h-3.5 text-primary fill-primary" />{rider?.rating?.toFixed(2) || '5.00'}</span></div>
            </div>
            <Link href="/rider/payouts" className="mt-4 block text-center text-sm text-primary hover:underline">Request Payout →</Link>
          </div>

          <div className="glass rounded-xl border border-border/60 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link href="/rider/requests" className="text-xs text-primary hover:underline">View requests →</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12"><Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No orders yet. Go online to start receiving requests!</p></div>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((o) => (
                  <Link key={o.id} href={`/rider/orders/${o.id}`} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {o.service_type === 'parcel' ? <Package className="w-5 h-5 text-primary shrink-0" /> : o.service_type === 'ride' ? <Bike className="w-5 h-5 text-info shrink-0" /> : <Pill className="w-5 h-5 text-warning shrink-0" />}
                      <div className="min-w-0"><p className="text-sm font-medium">{o.order_id}</p><p className="text-xs text-muted-foreground truncate">{o.pickup_address} → {o.dropoff_address}</p></div>
                    </div>
                    <div className="text-right shrink-0 ml-2"><p className="text-sm font-bold text-primary">{formatCurrency(o.rider_earning)}</p><p className="text-xs text-muted-foreground capitalize">{o.status.replace(/_/g, ' ')}</p></div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Fee Section */}
        <div className={`glass rounded-xl border p-6 mb-8 ${maintenanceExpired ? 'border-warning/40' : 'border-border/60'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${maintenanceExpired ? 'bg-warning/15' : 'bg-primary/15'}`}>
                {maintenanceExpired ? <AlertCircle className="w-6 h-6 text-warning" /> : <CheckCircle className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">Monthly Maintenance Fee</h2>
                <p className="text-sm text-muted-foreground">
                  {maintenanceExpired
                    ? '৳50 maintenance fee due. Please pay to continue accepting orders.'
                    : `Paid until ${maintenancePaidUntil?.toLocaleDateString('en-GB')}. Next payment due ${nextDueDate?.toLocaleDateString('en-GB')}.`}
                </p>
              </div>
            </div>
            {maintenanceExpired && (
              <button onClick={() => setShowFeeModal(true)} className="flex items-center gap-2 px-5 h-11 rounded-md bg-warning text-warning-foreground font-semibold text-sm hover:bg-warning/90 transition-all">
                <CreditCard className="w-4 h-4" /> Pay ৳50
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Fee Payment Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowFeeModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-md w-full glass-strong rounded-xl border border-border/60 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Monthly Maintenance Fee — ৳50</h3>

            <div className="rounded-lg bg-secondary/40 border border-border/60 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">bKash Number</span>
                <button onClick={() => { navigator.clipboard.writeText('+8801410348109'); toast.success('bKash number copied'); }} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <p className="text-lg font-bold text-primary">+8801410348109</p>
              <p className="text-xs text-muted-foreground mt-1">Account Type: Personal · Method: Send Money</p>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mb-4">
              <h4 className="text-sm font-semibold mb-2 text-primary">সেন্ড মানি করার নিয়ম:</h4>
              <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
                <li>আপনার bKash অ্যাপ ওপেন করুন</li>
                <li>"সেন্ড মানি" সিলেক্ট করুন</li>
                <li>+8801410348109 নম্বরে ৫০ টাকা পাঠান</li>
                <li>Transaction ID (TRX ID) কপি করুন</li>
                <li>স্ক্রিনশট নিন এবং নিচে আপলোড করুন</li>
                <li>TRX ID নিচের বক্সে লিখুন</li>
                <li>Submit বাটনে ক্লিক করুন</li>
              </ol>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">পেমেন্ট স্ক্রিনশট *</label>
              <label className="block">
                <div className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors">
                  {feeScreenshot ? (
                    <div className="flex items-center justify-center gap-2"><FileText className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{feeScreenshot.name}</span></div>
                  ) : (
                    <div className="flex items-center justify-center gap-2"><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">স্ক্রিনশট আপলোড করুন</span></div>
                  )}
                </div>
                <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && f.size <= 5 * 1024 * 1024) setFeeScreenshot(f);
                  else if (f) toast.error('File too large. Max 5MB.');
                }} />
              </label>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Transaction ID (TRX ID) *</label>
              <input type="text" value={feeTrxId} onChange={(e) => setFeeTrxId(e.target.value)} placeholder="যেমন: 9X8K7M3N2L" className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">আপনার bKash Number</label>
              <input type="text" value={feeSenderBkash} onChange={(e) => setFeeSenderBkash(e.target.value)} placeholder="01XXXXXXXXX" className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
            </div>

            <button
              onClick={async () => {
                if (!user || !rider) return;
                if (!feeTrxId || !feeScreenshot) { toast.error('Please enter TRX ID and attach screenshot'); return; }
                setFeeSubmitting(true);
                try {
                  const ext = feeScreenshot.name.split('.').pop();
                  const path = `rider-fees/${user.id}/maintenance-${Date.now()}.${ext}`;
                  const { error: uploadErr } = await supabase.storage.from('rider-docs').upload(path, feeScreenshot, { upsert: true });
                  if (uploadErr) { toast.error(uploadErr.message); setFeeSubmitting(false); return; }
                  const { data: urlData } = supabase.storage.from('rider-docs').getPublicUrl(path);

                  const paidUntil = new Date(); paidUntil.setMonth(paidUntil.getMonth() + 1);
                  const { error: updateErr } = await supabase.from('riders').update({
                    maintenance_fee_paid_until: paidUntil.toISOString().split('T')[0],
                    maintenance_fee_trx_id: feeTrxId,
                  }).eq('id', rider.id);
                  if (updateErr) throw updateErr;

                  notifyTelegramRiderFee({
                    rider_name: profile?.full_name || 'Rider',
                    rider_phone: rider.bkash_number || 'N/A',
                    fee_type: 'maintenance',
                    trx_id: feeTrxId,
                  });

                  const waMessage = `ভাই, আমি NagarGo এর সাইটে বিকাশ এর মাধ্যমে ৫০ টাকা পরিশোধ করেছি '${feeSenderBkash || rider.bkash_number || 'আমার'}' Number থেকে যার TrxID '${feeTrxId}' ! অনুগ্রহ করে কনফার্ম করবেন ।`;
                  window.open(`https://wa.me/8801683772714?text=${encodeURIComponent(waMessage)}`, '_blank');

                  toast.success('Maintenance fee submitted!');
                  setShowFeeModal(false);
                  setFeeTrxId(''); setFeeSenderBkash(''); setFeeScreenshot(null);
                  loadData();
                } catch (err: any) { toast.error(err.message || 'Failed to submit'); } finally { setFeeSubmitting(false); }
              }}
              disabled={feeSubmitting || !feeTrxId || !feeScreenshot}
              className="w-full flex items-center justify-center gap-2 px-5 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all"
            >
              {feeSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
              {feeSubmitting ? 'Submitting...' : 'Submit & Confirm via WhatsApp'}
            </button>
            <p className="text-center text-xs text-muted-foreground mt-2">Submit করলে স্বয়ংক্রিয়ভাবে WhatsApp এ কনফার্মেশন মেসেজ পাঠানো হবে</p>
          </motion.div>
        </div>
      )}
      <ApprovalPopup
        show={popup.show}
        type={popup.type}
        reason={popup.reason}
        onClose={() => setPopup({ show: false, type: popup.type })}
      />
    </SiteLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Package; label: string; value: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 border border-border/60">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </motion.div>
  );
}
