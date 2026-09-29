'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('support_tickets').select('*, profiles!support_tickets_user_id_fkey(full_name, phone)').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Ticket ${status}`);
    load();
  }, [load]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Support Tickets</h1>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16"><p className="text-sm text-muted-foreground">No support tickets</p></div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-lg border border-border/60 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div><p className="text-sm font-medium">{t.subject}</p><p className="text-xs text-muted-foreground">{t.ticket_id} · {t.profiles?.full_name}</p><p className="text-xs text-muted-foreground capitalize">{t.category.replace(/_/g, ' ')}</p></div>
                <span className={`text-xs capitalize shrink-0 ${t.status === 'resolved' || t.status === 'closed' ? 'text-primary' : t.status === 'open' ? 'text-warning' : 'text-info'}`}>{t.status.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
              <div className="flex gap-2 flex-wrap">
                {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                  <button key={s} onClick={() => updateStatus(t.id, s)} className={`px-2 h-7 rounded text-xs font-medium border capitalize ${t.status === s ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/30'}`}>{s.replace(/_/g, ' ')}</button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
