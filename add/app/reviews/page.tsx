'use client';

import { useState, useCallback } from 'react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Star, Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { notifyTelegramReview } from '@/lib/telegram';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({ name: '', gender: 'male', service: 'parcel', comment: '' });
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async () => {
    if (!form.name || !form.comment) { toast.error('Please fill name and comment'); return; }
    setLoading(true);
    const { error } = await supabase.from('reviews').insert({
      name: form.name, gender: form.gender, service: form.service, rating, comment: form.comment,
      status: 'pending', user_id: user?.id || null,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Review submitted! It will appear after admin approval.');
    notifyTelegramReview({ reviewer_name: form.name, rating, service: form.service, comment: form.comment });
    setForm({ name: '', gender: 'male', service: 'parcel', comment: '' });
    setRating(5);
  }, [form, rating, user]);

  return (
    <SiteLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Write a Review</h1>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-border/60 p-6 space-y-4">
          <div><label className="block text-xs text-muted-foreground mb-1.5">Your Name</label><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-muted-foreground mb-1.5">Gender</label><select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div><label className="block text-xs text-muted-foreground mb-1.5">Service Used</label><select value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40"><option value="parcel">Parcel Delivery</option><option value="ride">Ride</option><option value="medicine">Medicine Express</option></select></div>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Rating</label><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)}><Star className={`w-8 h-8 ${n <= rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} /></button>)}</div></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Your Review</label><textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} className="w-full px-3 h-28 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" /></div>
          <button onClick={submit} disabled={loading} className="w-full flex items-center justify-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Review
          </button>
        </motion.div>
      </div>
    </SiteLayout>
  );
}
