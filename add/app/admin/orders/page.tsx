'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return o.order_id?.toLowerCase().includes(q) || o.pickup_address?.toLowerCase().includes(q) || o.dropoff_address?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Orders Management</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-10 pr-4 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
        </div>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setLoading(true); }} className="px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40">
          <option value="all">All Status</option>
          <option value="requested">Requested</option>
          <option value="rider_assigned">Rider Assigned</option>
          <option value="in_transit">In Transit</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><p className="text-sm text-muted-foreground">No orders found</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass rounded-lg border border-border/60 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium">{o.order_id}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-secondary text-muted-foreground">{o.service_type}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{o.pickup_address} → {o.dropoff_address}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(o.created_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">{formatCurrency(o.total_fare)}</p>
                <span className="text-xs capitalize text-muted-foreground">{o.status.replace(/_/g, ' ')}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
