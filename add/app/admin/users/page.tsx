'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = useCallback(async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_active: !currentActive }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(!currentActive ? 'User reactivated' : 'User suspended');
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !currentActive } : u));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.phone?.includes(search) || u.email?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Users Management</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or email..." className="w-full pl-10 pr-4 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><p className="text-sm text-muted-foreground">No users found</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass rounded-lg border border-border/60 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{u.full_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${u.role === 'admin' ? 'bg-primary/15 text-primary' : u.role === 'rider' ? 'bg-info/15 text-info' : 'bg-secondary text-muted-foreground'}`}>{u.role}</span>
                  {u.is_active === false && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">Suspended</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{u.phone} · {u.email || 'No email'}</p>
                <p className="text-xs text-muted-foreground">{u.division ? `${u.division}, ${u.district || ''}` : 'No location'}</p>
              </div>
              {u.role !== 'admin' && (
                <button
                  onClick={() => toggleActive(u.id, u.is_active !== false)}
                  className={`flex items-center gap-1 px-3 h-9 rounded-md text-xs font-medium border shrink-0 transition-all ${u.is_active === false ? 'border-primary/30 text-primary hover:bg-primary/10' : 'border-destructive/30 text-destructive hover:bg-destructive/10'}`}
                >
                  {u.is_active === false ? <><CheckCircle className="w-4 h-4" /> Activate</> : <><Ban className="w-4 h-4" /> Suspend</>}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
