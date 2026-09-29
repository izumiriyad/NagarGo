'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Loader2 } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { notifyTelegramPayout } from '@/lib/telegram';
import { ApprovalPopup } from '@/components/shared/approval-popup';

export default function RiderPayoutsPage() {
  const { user } = useAuth();
  const [rider, setRider] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [amount, setAmount] = useState('');
  const [popup, setPopup] = useState<{ show: boolean; type: 'approved' | 'rejected'; reason?: string | null }>({ show: false, type: 'approved' });
  const prevStatusesRef = useRef<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) return;
    const { data: riderData } = await supabase.from('riders').select('*, profiles!riders_user_id_fkey(full_name)').eq('user_id', user.id).maybeSingle();
    setRider(riderData);
    if (riderData) {
      const { data: payoutData } = await supabase.from('payouts').select('*').eq('rider_id', riderData.id).order('created_at', { ascending: false });
      setPayouts(payoutData || []);

      if (payoutData) {
        for (const p of payoutData) {
          const prev = prevStatusesRef.current[p.id];
          if (prev && prev !== p.status) {
            if (p.status === 'paid') {
              setPopup({ show: true, type: 'approved', reason: null });
            } else if (p.status === 'rejected') {
              setPopup({ show: true, type: 'rejected', reason: p.rejection_reason });
            }
          }
          prevStatusesRef.current[p.id] = p.status;
        }
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription for payout status changes
  useEffect(() => {
    if (!rider) return;
    const channel = supabase
      .channel(`payouts-${rider.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payouts', filter: `rider_id=eq.${rider.id}` },
        () => { load(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [rider, load]);

  const requestPayout = useCallback(async () => {
    if (!rider) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > (rider.available_earnings || 0)) { toast.error('Amount exceeds available earnings'); return; }
    setRequesting(true);
    const { data: payoutData, error } = await supabase.from('payouts').insert({
      rider_id: rider.id, amount: amt, status: 'requested', method: 'bkash', bkash_number: rider.bkash_number,
    }).select('id').single();
    setRequesting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Payout requested!');
    notifyTelegramPayout({
      payout_id: payoutData.id,
      rider_name: rider.profiles?.full_name || 'Rider',
      amount: amt,
      bkash_number: rider.bkash_number || 'N/A',
    });
    setAmount('');
    load();
  }, [rider, amount, load]);

  if (loading) return <SiteLayout><div className="max-w-2xl mx-auto px-4 py-20"><div className="h-40 rounded-xl bg-secondary/30 animate-pulse" /></div></SiteLayout>;

  return (
    <SiteLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Payouts</h1>

        <div className="glass rounded-xl border border-border/60 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center"><p className="text-xs text-muted-foreground">Available</p><p className="text-lg font-bold text-primary">{formatCurrency(rider?.available_earnings || 0)}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Pending</p><p className="text-lg font-bold">{formatCurrency(rider?.pending_earnings || 0)}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Paid</p><p className="text-lg font-bold">{formatCurrency(rider?.paid_earnings || 0)}</p></div>
          </div>
          <div className="flex gap-2">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount to withdraw" className="flex-1 px-3 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
            <button onClick={requestPayout} disabled={requesting || !rider?.available_earnings} className="flex items-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright disabled:opacity-50 transition-all">
              {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />} Request
            </button>
          </div>
          {rider?.bkash_number && <p className="text-xs text-muted-foreground mt-2">Payouts sent to bKash: {rider.bkash_number}</p>}
        </div>

        <div className="glass rounded-xl border border-border/60 p-6">
          <h2 className="text-lg font-semibold mb-4">Payout History</h2>
          {payouts.length === 0 ? (
            <div className="text-center py-12"><DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No payout requests yet</p></div>
          ) : (
            <div className="space-y-2">
              {payouts.map((p) => (
                <div key={p.id} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">{formatCurrency(p.amount)}</p><p className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</p></div>
                    <span className={`text-xs font-medium capitalize ${p.status === 'paid' ? 'text-primary' : p.status === 'rejected' ? 'text-destructive' : 'text-warning'}`}>{p.status}</span>
                  </div>
                  {p.status === 'rejected' && p.rejection_reason && (
                    <div className="mt-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                      <p className="text-xs font-medium text-destructive">Rejection Reason:</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ApprovalPopup
        show={popup.show}
        type={popup.type}
        reason={popup.reason}
        title={popup.type === 'approved' ? 'Payout Approved!' : 'Payout Rejected'}
        message={popup.type === 'approved' ? 'Your payout has been processed and sent to your bKash account.' : undefined}
        onClose={() => setPopup({ show: false, type: popup.type })}
      />
    </SiteLayout>
  );
}
