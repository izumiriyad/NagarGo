'use client';

import { useEffect, useState, useCallback } from 'react';
import { SiteLayout } from '@/components/layout/site-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, User, Phone, Mail, MapPin, Save, LogOut } from 'lucide-react';
import { divisions } from '@/lib/data/bangladesh';

export default function AccountPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', division: '', district: '', area: '' });

  useEffect(() => {
    if (profile) setForm({ fullName: profile.full_name || '', phone: profile.phone || '', email: profile.email || '', division: profile.division || '', district: profile.district || '', area: profile.area || '' });
  }, [profile]);

  const save = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.fullName, phone: form.phone, email: form.email,
      division: form.division, district: form.district, area: form.area, updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Profile updated');
    refreshProfile();
  }, [user, form, refreshProfile]);

  if (!user) {
    return <SiteLayout><div className="max-w-md mx-auto px-4 py-20 text-center"><h1 className="text-xl font-bold mb-4">Please login</h1></div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display), system-ui' }}>My Account</h1>

        <div className="glass rounded-xl border border-border/60 p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center"><User className="w-8 h-8 text-primary" /></div>
            <div><p className="font-semibold">{profile?.full_name}</p><p className="text-sm text-muted-foreground capitalize">{profile?.role}</p></div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-muted-foreground mb-1">Full Name</label><input type="text" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" /></div>
              <div><label className="block text-xs text-muted-foreground mb-1">Phone</label><input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" /></div>
            </div>
            <div><label className="block text-xs text-muted-foreground mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" /></div>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.division} onChange={(e) => setForm((f) => ({ ...f, division: e.target.value, district: '' }))} className="px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40"><option value="">Division</option>{divisions.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}</select>
              <select value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className="px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40"><option value="">District</option>{divisions.find((d) => d.name === form.division)?.districts.map((d) => <option key={d} value={d}>{d}</option>)}</select>
            </div>
            <input type="text" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} placeholder="Area" className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
            <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </div>

        <button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-5 h-11 rounded-md border border-destructive/30 text-destructive font-medium text-sm hover:bg-destructive/10 transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </SiteLayout>
  );
}
