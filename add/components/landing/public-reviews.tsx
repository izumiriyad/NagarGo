'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import { Star, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/format';

interface Review {
  id: string;
  name: string;
  gender: string | null;
  service: string;
  rating: number;
  comment: string;
  created_at: string;
  is_demo: boolean;
}

const serviceLabels: Record<string, string> = {
  parcel: 'Parcel Delivery',
  ride: 'Ride',
  medicine: 'Medicine Express',
};

export function PublicReviews() {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(12);
      setReviews(data as Review[] || []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold"
          style={{ fontFamily: 'var(--font-display), system-ui' }}
        >
          {t('reviews.title')}
        </motion.h2>
        <p className="text-muted-foreground mt-2">{t('reviews.subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-6 border border-border/60 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-6 border border-border/60"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, idx) => (
                  <Star
                    key={idx}
                    className={`w-4 h-4 ${idx < r.rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{r.comment}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{serviceLabels[r.service] || r.service}</p>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
              </div>
              {r.is_demo && (
                <span className="mt-2 inline-block text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                  Demo
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {reviews.length === 0 && !loading && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      )}
    </section>
  );
}
