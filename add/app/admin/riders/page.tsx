'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    let query = supabase.from('riders').select('*, profiles!riders_user_id_fkey(full_name, phone, email)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setRiders(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const approve = useCallback(async (id: string) => {
    const { data: rider } = await supabase.from('riders').select('user_id').eq('id', id).maybeSingle();
    const { error } = await supabase.from('riders').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    if (rider?.user_id) {
      await supabase.from('profiles').update({ role: 'rider' }).eq('id', rider.user_id);
    }
    toast.success('Rider approved');
    load();
  }, [load]);

  const reject = useCallback(async (id: string) => {
    const { error } = await supabase.from('riders').update({ status: 'rejected' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Rider rejected');
    load();
  }, [load]);

  const filtered = riders.filter((r) => {
    const name = r.profiles?.full_name || '';
    const phone = r.profiles?.phone || '';
    return name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search);
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Riders Management</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..." className="w-full pl-10 pr-4 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['all', 'submitted', 'under_review', 'approved', 'rejected', 'suspended'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setLoading(true); }} className={`px-3 h-10 rounded-md text-xs font-medium border shrink-0 capitalize ${filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground'}`}>{f.replace(/_/g, ' ')}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><p className="text-sm text-muted-foreground">No riders found</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-lg border border-border/60 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{r.profiles?.full_name || 'Unknown'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${r.status === 'approved' ? 'bg-primary/15 text-primary' : r.status === 'rejected' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>{r.status.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.profiles?.phone} · {r.vehicle_type} · {r.vehicle_registration}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Zone: {r.preferred_zone || 'N/A'} · Rating: {r.rating?.toFixed(2) || '5.00'} · Trips: {r.total_trips || 0}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {r.status === 'submitted' || r.status === 'under_review' || r.status === 'document_review' ? (
                  <>
                    <button onClick={() => approve(r.id)} className="flex items-center gap-1 px-3 h-9 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"><CheckCircle className="w-4 h-4" /> Approve</button>
                    <button onClick={() => reject(r.id)} className="flex items-center gap-1 px-3 h-9 rounded-md border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-all"><XCircle className="w-4 h-4" /> Reject</button>
                  </>
                ) : r.status === 'approved' ? (
                  <button onClick={async () => { await supabase.from('riders').update({ status: 'suspended' }).eq('id', r.id); toast.success('Rider suspended'); load(); }} className="flex items-center gap-1 px-3 h-9 rounded-md border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-all">Suspend</button>
                ) : r.status === 'suspended' ? (
                  <button onClick={() => approve(r.id)} className="flex items-center gap-1 px-3 h-9 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-all">Restore</button>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
