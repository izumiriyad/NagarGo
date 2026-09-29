'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Bike, Package, DollarSign, CheckCircle, XCircle, Clock, TrendingUp, Bell } from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, riders: 0, pendingRiders: 0, orders: 0, revenue: 0, pendingPayments: 0, activeTrips: 0, cancelledOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [users, riders, pendingRiders, orders, payments, activeTrips, cancelled] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('riders').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('riders').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review', 'document_review']),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('payments').select('amount').in('status', ['pending', 'submitted', 'under_review']),
      supabase.from('tracking_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayOrders = (orders.data || []).filter((o: any) => new Date(o.created_at) >= today);
    const revenue = todayOrders.reduce((sum: number, o: any) => sum + (o.total_fare || 0), 0);

    setStats({
      users: users.count || 0,
      riders: riders.count || 0,
      pendingRiders: pendingRiders.count || 0,
      orders: todayOrders.length,
      revenue,
      pendingPayments: (payments.data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
      activeTrips: activeTrips.count || 0,
      cancelledOrders: cancelled.count || 0,
    });
    setRecentOrders(orders.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cards = [
    { label: 'Total Users', value: String(stats.users), icon: Users, color: 'text-info' },
    { label: 'Active Riders', value: String(stats.riders), icon: Bike, color: 'text-primary' },
    { label: 'Pending Riders', value: String(stats.pendingRiders), icon: Clock, color: 'text-warning' },
    { label: "Today's Orders", value: String(stats.orders), icon: Package, color: 'text-primary' },
    { label: "Today's Revenue", value: formatCurrency(stats.revenue), icon: TrendingUp, color: 'text-primary' },
    { label: 'Pending Payments', value: formatCurrency(stats.pendingPayments), icon: DollarSign, color: 'text-warning' },
    { label: 'Active Trips', value: String(stats.activeTrips), icon: Bell, color: 'text-info' },
    { label: 'Cancelled Orders', value: String(stats.cancelledOrders), icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4 border border-border/60">
            <c.icon className={`w-5 h-5 ${c.color} mb-2`} />
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-xl font-bold mt-1">{c.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-xl border border-border/60 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div><p className="text-sm font-medium">{o.order_id}</p><p className="text-xs text-muted-foreground">{o.pickup_address} → {o.dropoff_address}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-primary">{formatCurrency(o.total_fare)}</p><p className="text-xs text-muted-foreground capitalize">{o.status.replace(/_/g, ' ')}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
