'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Star, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setReviews(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const approve = useCallback(async (id: string) => {
    const { error } = await supabase.from('reviews').update({ status: 'approved' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Review approved'); load();
  }, [load]);

  const reject = useCallback(async (id: string) => {
    const { error } = await supabase.from('reviews').update({ status: 'rejected' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Review rejected'); load();
  }, [load]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Reviews Moderation</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setLoading(true); }} className={`px-4 h-10 rounded-md text-xs font-medium border shrink-0 capitalize ${filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground'}`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16"><Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No reviews found</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-lg border border-border/60 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{r.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-secondary text-muted-foreground">{r.service}</span>
                    {r.is_demo && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Demo</span>}
                  </div>
                  <div className="flex items-center gap-0.5 mb-1">
                    {[...Array(5)].map((_, idx) => <Star key={idx} className={`w-3.5 h-3.5 ${idx < r.rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />)}
                  </div>
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(r.created_at)}</p>
                </div>
                <span className={`text-xs capitalize shrink-0 ${r.status === 'approved' ? 'text-primary' : r.status === 'rejected' ? 'text-destructive' : 'text-warning'}`}>{r.status}</span>
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => approve(r.id)} className="flex items-center gap-1 px-3 h-9 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"><CheckCircle className="w-4 h-4" /> Approve</button>
                  <button onClick={() => reject(r.id)} className="flex items-center gap-1 px-3 h-9 rounded-md border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-all"><XCircle className="w-4 h-4" /> Reject</button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
