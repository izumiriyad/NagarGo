'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Search, DollarSign } from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    let query = supabase.from('payments').select('*, profiles!payments_customer_id_fkey(full_name, phone)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setPayments(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const verify = useCallback(async (id: string) => {
    const { error } = await supabase.from('payments').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Payment verified');
    load();
  }, [load]);

  const reject = useCallback(async (id: string) => {
    const { error } = await supabase.from('payments').update({ status: 'rejected' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Payment rejected');
    load();
  }, [load]);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return p.order_id?.toLowerCase().includes(q) || p.trx_id?.toLowerCase().includes(q) || p.profiles?.phone?.includes(search);
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Payments Management</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Order ID, TRX ID, or phone..." className="w-full pl-10 pr-4 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['all', 'pending', 'submitted', 'under_review', 'verified', 'rejected', 'refunded'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setLoading(true); }} className={`px-3 h-10 rounded-md text-xs font-medium border shrink-0 capitalize ${filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground'}`}>{f.replace(/_/g, ' ')}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No payments found</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-lg border border-border/60 p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{p.payment_id}</p>
                  <p className="text-xs text-muted-foreground">Order: {p.order_id} · TRX: {p.trx_id} · {p.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.sender_bkash_number} · {formatDateTime(p.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-primary">{formatCurrency(p.amount)}</p>
                  <span className={`text-xs capitalize ${p.status === 'verified' ? 'text-primary' : p.status === 'rejected' ? 'text-destructive' : 'text-warning'}`}>{p.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
              {(p.status === 'submitted' || p.status === 'pending' || p.status === 'under_review') && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => verify(p.id)} className="flex items-center gap-1 px-3 h-9 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"><CheckCircle className="w-4 h-4" /> Verify</button>
                  <button onClick={() => reject(p.id)} className="flex items-center gap-1 px-3 h-9 rounded-md border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-all"><XCircle className="w-4 h-4" /> Reject</button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
