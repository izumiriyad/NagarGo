'use client';

import { useEffect, useState, useCallback } from 'react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/format';
import { Bell, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    load();
  }, [user, load]);

  return (
    <SiteLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display), system-ui' }}>Notifications</h1>
          {notifications.some((n) => !n.is_read) && <button onClick={markAllRead} className="flex items-center gap-1 text-sm text-primary hover:underline"><CheckCircle className="w-4 h-4" /> Mark all read</button>}
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 glass rounded-xl border border-border/60">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`glass rounded-lg border p-4 ${n.is_read ? 'border-border/60' : 'border-primary/30 bg-primary/5'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
