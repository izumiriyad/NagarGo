'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, Copy, MessageCircle, CheckCircle, Send } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, generateOrderId } from '@/lib/format';
import { toast } from 'sonner';
import { notifyTelegramPayment } from '@/lib/telegram';
import { ApprovalPopup } from '@/components/shared/approval-popup';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ orderId: '', amount: '', senderBkashNumber: '', trxId: '', paymentTime: '' });
  const [popup, setPopup] = useState<{ show: boolean; type: 'approved' | 'rejected'; reason?: string | null }>({ show: false, type: 'approved' });
  const prevStatusesRef = useRef<Record<string, string>>({});

  const loadPayments = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('payments').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
    setPayments(data || []);
    setLoading(false);

    // Check for status changes to trigger popups
    if (data) {
      for (const p of data) {
        const prev = prevStatusesRef.current[p.id];
        if (prev && prev !== p.status) {
          if (p.status === 'verified') {
            setPopup({ show: true, type: 'approved', reason: null });
          } else if (p.status === 'rejected') {
            setPopup({ show: true, type: 'rejected', reason: p.rejection_reason });
          }
        }
        prevStatusesRef.current[p.id] = p.status;
      }
    }
  }, [user]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  // Realtime subscription for payment status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`payments-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments', filter: `customer_id=eq.${user.id}` },
        () => { loadPayments(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadPayments]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');
    if (orderId) setForm((f) => ({ ...f, orderId }));
  }, []);

  const submit = useCallback(async () => {
    if (!user) { toast.error('Please login'); return; }
    if (!form.orderId || !form.amount || !form.trxId || !form.senderBkashNumber) { toast.error('Please fill all required fields'); return; }
    setSubmitting(true);
    try {
      const paymentId = generateOrderId('PAY');
      const { data: existing } = await supabase.from('payments').select('id').eq('trx_id', form.trxId).maybeSingle();
      if (existing) { toast.error('This Transaction ID has already been submitted'); setSubmitting(false); return; }

      const { data: payData, error } = await supabase.from('payments').insert({
        payment_id: paymentId, order_id: form.orderId, customer_id: user.id,
        amount: parseFloat(form.amount), method: 'bkash', status: 'submitted',
        sender_bkash_number: form.senderBkashNumber, trx_id: form.trxId,
        payment_time: form.paymentTime || new Date().toISOString(),
      }).select('id').single();
      if (error) throw error;
      toast.success('Payment submitted for verification');
      notifyTelegramPayment({
        payment_id: payData.id,
        order_id: form.orderId,
        amount: parseFloat(form.amount),
        trx_id: form.trxId,
        sender_bkash_number: form.senderBkashNumber,
      });
      setForm({ orderId: '', amount: '', senderBkashNumber: '', trxId: '', paymentTime: '' });
      loadPayments();
    } catch (err: any) { toast.error(err.message || 'Failed to submit payment'); } finally { setSubmitting(false); }
  }, [user, form, loadPayments]);

  const whatsappMessage = `Hello NagarGo,
I have submitted a manual bKash payment.

Order ID: ${form.orderId}
Payment Amount: ৳${form.amount}
TRX ID: ${form.trxId}
Sender Number: ${form.senderBkashNumber}

Please verify my payment.`;

  const copyBkash = () => { navigator.clipboard.writeText('+8801410348109'); toast.success('bKash number copied'); };

  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Payments</h1>

        {/* bKash payment form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-border/60 p-6 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-primary" /> Manual bKash Send Money</h2>

          <div className="rounded-lg bg-secondary/40 border border-border/60 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">bKash Number</span>
              <button onClick={copyBkash} className="flex items-center gap-1 text-xs text-primary hover:underline"><Copy className="w-3 h-3" /> Copy</button>
            </div>
            <p className="text-lg font-bold text-primary">+8801410348109</p>
            <p className="text-xs text-muted-foreground mt-1">Account Type: Personal · Method: Send Money</p>
          </div>

          <div className="space-y-3 mb-4">
            <p className="text-sm font-medium">Instructions:</p>
            <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
              <li>Open bKash app</li>
              <li>Select Send Money</li>
              <li>Send the required amount to +8801410348109</li>
              <li>Copy the Transaction ID (TRX ID)</li>
              <li>Submit the transaction information below</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Input label="Order ID *" value={form.orderId} onChange={(v) => setForm((f) => ({ ...f, orderId: v }))} />
            <Input label="Payment Amount (৳) *" value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} type="number" />
            <Input label="Your bKash Number *" value={form.senderBkashNumber} onChange={(v) => setForm((f) => ({ ...f, senderBkashNumber: v }))} placeholder="01XXXXXXXXX" />
            <Input label="Transaction ID (TRX ID) *" value={form.trxId} onChange={(v) => setForm((f) => ({ ...f, trxId: v }))} />
            <Input label="Payment Time" value={form.paymentTime} onChange={(v) => setForm((f) => ({ ...f, paymentTime: v }))} type="datetime-local" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={submit} disabled={submitting || !user} className="flex items-center justify-center gap-2 px-4 h-11 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright disabled:opacity-50 transition-all">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </button>
            <a href={`https://wa.me/8801410348109?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 h-11 rounded-md border border-border/60 text-sm font-medium hover:border-primary/30 transition-all">
              <MessageCircle className="w-4 h-4 text-primary" /> Confirm via WhatsApp
            </a>
          </div>
          {!user && <p className="text-center text-sm text-muted-foreground mt-3">Please login to submit a payment.</p>}
        </motion.div>

        {/* Payment history */}
        <div className="glass rounded-xl border border-border/60 p-6">
          <h2 className="text-lg font-semibold mb-4">Payment History</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12"><CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No payments yet</p></div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">{p.payment_id}</p><p className="text-xs text-muted-foreground">Order: {p.order_id} · TRX: {p.trx_id}</p></div>
                    <div className="text-right"><p className="text-sm font-bold">{formatCurrency(p.amount)}</p><p className={`text-xs capitalize ${p.status === 'verified' ? 'text-primary' : p.status === 'rejected' ? 'text-destructive' : 'text-warning'}`}>{p.status.replace(/_/g, ' ')}</p></div>
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
        title={popup.type === 'approved' ? 'Payment Verified!' : 'Payment Rejected'}
        message={popup.type === 'approved' ? 'Your bKash payment has been verified successfully.' : undefined}
        onClose={() => setPopup({ show: false, type: popup.type })}
      />
    </SiteLayout>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
    </div>
  );
}
