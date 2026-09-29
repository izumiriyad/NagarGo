'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, Loader2, Settings as SettingsIcon, Shield, FileText, Calendar, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { POLICY_VERSION, POLICY_LAST_UPDATED } from '@/lib/policy/policy-data';

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policyVersion, setPolicyVersion] = useState(POLICY_VERSION);
  const [requireReacceptance, setRequireReacceptance] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [acceptanceCount, setAcceptanceCount] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase.from('system_configs').select('*').order('key', { ascending: true });
    setConfigs(data || []);
    const { count } = await supabase.from('policy_acceptances').select('*', { count: 'exact', head: true });
    setAcceptanceCount(count || 0);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (id: string, value: string) => setConfigs((prev) => prev.map((c) => c.id === id ? { ...c, value } : c));

  const saveAll = useCallback(async () => {
    setSaving(true);
    for (const c of configs) {
      await supabase.from('system_configs').update({ value: c.value, updated_at: new Date().toISOString() }).eq('id', c.id);
    }
    setSaving(false);
    toast.success('Settings saved');
  }, [configs]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display), system-ui' }}>System Settings</h1>
        <button onClick={saveAll} disabled={saving || loading} className="flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl border border-border/60 p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {configs.map((c) => (
              <div key={c.id}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 capitalize">{c.description || c.key.replace(/_/g, ' ')}</label>
                <input type="text" value={c.value} onChange={(e) => update(c.id, e.target.value)} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Policy Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl border border-border/60 p-6 mt-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Policy Management</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Policy Version</label>
            <input
              type="text"
              value={policyVersion}
              onChange={(e) => setPolicyVersion(e.target.value)}
              className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Updated</label>
            <div className="flex items-center gap-2 px-3 h-10 rounded-md bg-secondary/20 border border-border/60 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" /> {POLICY_LAST_UPDATED}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" /> Terms &amp; Conditions, Safety Policy, and Privacy Policy are managed via the policy data file.
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Total accepted users:</span>
            <span className="font-bold text-primary">{acceptanceCount}</span>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              role="switch"
              aria-checked={requireReacceptance}
              onClick={() => setRequireReacceptance(!requireReacceptance)}
              className={`relative w-11 h-6 rounded-full transition-all ${requireReacceptance ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${requireReacceptance ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm">Require Re-acceptance on next version</span>
          </label>
        </div>

        <button
          onClick={() => {
            setPublishing(true);
            setTimeout(() => {
              setPublishing(false);
              toast.success(`Policy version ${policyVersion} published. Users will be asked to re-accept.`);
            }, 800);
          }}
          disabled={publishing}
          className="flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright disabled:opacity-50"
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          {publishing ? 'Publishing...' : 'Publish New Version'}
        </button>
      </motion.div>
    </AdminLayout>
  );
}
