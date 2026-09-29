'use client';

import { useEffect, useState, useCallback } from 'react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GpsCard, GpsLocation } from '@/components/shared/gps-card';
import { divisions } from '@/lib/data/bangladesh';
import { notifyTelegramLocation } from '@/lib/telegram';

export default function LocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gps, setGps] = useState<GpsLocation | null>(null);
  const [form, setForm] = useState({ label: '', type: 'pickup', address: '', division: '', district: '', area: '', landmark: '', contactName: '', contactPhone: '' });

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_locations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setLocations(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async () => {
    if (!user || !form.label || !form.address) { toast.error('Please fill label and address'); return; }
    setSaving(true);
    const { error } = await supabase.from('saved_locations').insert({
      user_id: user.id, label: form.label, type: form.type, address: form.address,
      latitude: gps?.lat, longitude: gps?.lng, accuracy: gps?.accuracy,
      division: form.division, district: form.district, area: form.area, landmark: form.landmark,
      contact_name: form.contactName, contact_phone: form.contactPhone,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Location saved');
    const { data: profData } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
    notifyTelegramLocation({
      customer_name: profData?.full_name || 'Unknown',
      location_name: form.label,
      location_address: form.address,
      location_lat: gps?.lat,
      location_lng: gps?.lng,
    });
    setShowForm(false); setForm({ label: '', type: 'pickup', address: '', division: '', district: '', area: '', landmark: '', contactName: '', contactPhone: '' }); setGps(null);
    load();
  }, [user, form, gps, load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('saved_locations').delete().eq('id', id).eq('user_id', user?.id || '');
    if (error) { toast.error(error.message); return; }
    toast.success('Location deleted');
    load();
  }, [user, load]);

  return (
    <SiteLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display), system-ui' }}>Saved Locations</h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-bright transition-all">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="glass rounded-xl border border-border/60 p-6 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Label</label>
                    <input type="text" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Home, Office..." className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Type</label>
                    <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40">
                      <option value="pickup">Pickup</option>
                      <option value="dropoff">Drop-off</option>
                    </select>
                  </div>
                </div>
                <GpsCard onLocationDetected={setGps} compact />
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Address</label>
                  <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.division} onChange={(e) => setForm((f) => ({ ...f, division: e.target.value, district: '' }))} className="px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40">
                    <option value="">Division</option>
                    {divisions.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                  <select value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className="px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40">
                    <option value="">District</option>
                    {divisions.find((d) => d.name === form.division)?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} placeholder="Area" className="px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
                  <input type="text" value={form.landmark} onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))} placeholder="Landmark" className="px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} placeholder="Contact Name" className="px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
                  <input type="text" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} placeholder="Contact Phone" className="px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
                </div>
                <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Location
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
        ) : locations.length === 0 ? (
          <div className="text-center py-16 glass rounded-xl border border-border/60">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No saved locations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((l) => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg border border-border/60 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-primary" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-medium">{l.label}</p><span className="text-xs px-1.5 py-0.5 rounded capitalize bg-secondary text-muted-foreground">{l.type}</span></div>
                    <p className="text-xs text-muted-foreground truncate">{l.address}</p>
                    {l.contact_name && <p className="text-xs text-muted-foreground">{l.contact_name} · {l.contact_phone}</p>}
                  </div>
                </div>
                <button onClick={() => remove(l.id)} className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"><Trash2 className="w-4 h-4" /></button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
