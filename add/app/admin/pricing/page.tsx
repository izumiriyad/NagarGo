'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { Loader2, Save, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPricingPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('pricing_configs').select('*').order('zone_name', { ascending: true });
    setConfigs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (id: string, key: string, value: any) => {
    setConfigs((prev) => prev.map((c) => c.id === id ? { ...c, [key]: value } : c));
  };

  const save = useCallback(async (id: string) => {
    setSaving(id);
    const config = configs.find((c) => c.id === id);
    if (!config) return;
    const { error } = await supabase.from('pricing_configs').update({
      base_fare: config.base_fare, included_distance_km: config.included_distance_km,
      per_km: config.per_km, minimum_fare: config.minimum_fare, service_fee: config.service_fee,
      waiting_per_minute: config.waiting_per_minute, peak_multiplier: config.peak_multiplier,
      night_surcharge: config.night_surcharge, commission_percent: config.commission_percent,
      rider_percent: config.rider_percent, updated_at: new Date().toISOString(),
    }).eq('id', id);
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Pricing updated');
  }, [configs]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>Pricing Configuration</h1>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-48 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {configs.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-xl border border-border/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{c.zone_name} · <span className="text-muted-foreground capitalize">{c.service_type}</span></h3>
                </div>
                <button onClick={() => save(c.id)} disabled={saving === c.id} className="flex items-center gap-1 px-3 h-9 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 disabled:opacity-50">
                  {saving === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <NumField label="Base Fare" value={c.base_fare} onChange={(v) => update(c.id, 'base_fare', v)} />
                <NumField label="Included KM" value={c.included_distance_km} onChange={(v) => update(c.id, 'included_distance_km', v)} />
                <NumField label="Per KM" value={c.per_km} onChange={(v) => update(c.id, 'per_km', v)} />
                <NumField label="Minimum Fare" value={c.minimum_fare} onChange={(v) => update(c.id, 'minimum_fare', v)} />
                <NumField label="Service Fee" value={c.service_fee} onChange={(v) => update(c.id, 'service_fee', v)} />
                <NumField label="Waiting/Min" value={c.waiting_per_minute} onChange={(v) => update(c.id, 'waiting_per_minute', v)} />
                <NumField label="Commission %" value={c.commission_percent} onChange={(v) => update(c.id, 'commission_percent', v)} />
                <NumField label="Rider %" value={c.rider_percent} onChange={(v) => update(c.id, 'rider_percent', v)} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <input type="number" step="0.01" value={value || 0} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full px-2 h-9 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
    </div>
  );
}
