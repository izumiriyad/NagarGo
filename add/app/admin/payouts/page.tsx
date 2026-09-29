'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('payouts').select('*, riders!payouts_rider_id_fkey(bkash_number, user_id, profiles!riders_user_id_fkey(full_name))').order('created_at', { ascending: false });
    setPayouts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const process = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from('payouts').update({ status, processed_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Payout ${status}`);
    load();
  }, [load]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Payouts</h1>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-16"><p className="text-sm text-muted-foreground">No payout requests</p></div>
      ) : (
        <div className="space-y-2">
          {payouts.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-lg border border-border/60 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{p.riders?.profiles?.full_name || 'Rider'}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(p.amount)} · bKash: {p.riders?.bkash_number || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs capitalize ${p.status === 'paid' ? 'text-primary' : p.status === 'rejected' ? 'text-destructive' : 'text-warning'}`}>{p.status}</span>
                {p.status === 'requested' && (
                  <div className="flex gap-1">
                    <button onClick={() => process(p.id, 'paid')} className="flex items-center gap-1 px-2 h-8 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs"><CheckCircle className="w-3.5 h-3.5" /> Pay</button>
                    <button onClick={() => process(p.id, 'rejected')} className="flex items-center gap-1 px-2 h-8 rounded-md border border-destructive/30 text-destructive text-xs"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
