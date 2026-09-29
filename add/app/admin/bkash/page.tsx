'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Search, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminBkashPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('payments').select('*, profiles!payments_customer_id_fkey(full_name, phone)').eq('method', 'bkash').order('created_at', { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return p.trx_id?.toLowerCase().includes(q) || p.order_id?.toLowerCase().includes(q) || p.sender_bkash_number?.includes(search);
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>bKash Transactions</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by TRX ID, Order ID, or phone..." className="w-full pl-10 pr-4 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No bKash transactions</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-lg border border-border/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-medium">TRX: {p.trx_id}</p><p className="text-xs text-muted-foreground">Order: {p.order_id} · From: {p.sender_bkash_number}</p><p className="text-xs text-muted-foreground">{p.profiles?.full_name} · {formatDateTime(p.created_at)}</p></div>
                <div className="text-right"><p className="text-lg font-bold text-primary">{formatCurrency(p.amount)}</p><span className={`text-xs capitalize ${p.status === 'verified' ? 'text-primary' : p.status === 'rejected' ? 'text-destructive' : 'text-warning'}`}>{p.status}</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
