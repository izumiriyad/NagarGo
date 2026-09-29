'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, UserPlus, User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { Logo } from '@/components/shared/logo';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isValidBdPhone, normalizeBdPhone } from '@/lib/format';
import { divisions } from '@/lib/data/bangladesh';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', division: '', district: '' });

  const submit = useCallback(async () => {
    if (!form.fullName || !form.email || !form.phone || !form.password) { toast.error('Please fill all fields'); return; }
    if (!isValidBdPhone(form.phone)) { toast.error('Please enter a valid Bangladesh phone number'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, normalizeBdPhone(form.phone));
    setLoading(false);
    if (error) { toast.error(error); return; }
    toast.success('Account created! Welcome to NagarGo.');
    router.push('/dashboard');
  }, [form, signUp, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background-2 to-background-3" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass-strong rounded-2xl border border-border/60 p-8">
        <div className="flex justify-center mb-6"><Logo /></div>
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Join NagarGo today</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className="w-full pl-10 pr-4 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" placeholder="Your full name" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full pl-10 pr-4 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full pl-10 pr-4 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" placeholder="01XXXXXXXXX" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Division</label>
              <select value={form.division} onChange={(e) => setForm((f) => ({ ...f, division: e.target.value, district: '' }))} className="w-full px-3 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40">
                <option value="">Select</option>
                {divisions.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">District</label>
              <select value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className="w-full px-3 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40">
                <option value="">Select</option>
                {divisions.find((d) => d.name === form.division)?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full pl-10 pr-4 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" placeholder="Min 6 characters" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} className="w-full pl-10 pr-4 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" placeholder="Repeat password" />
            </div>
          </div>
          <button onClick={submit} disabled={loading} className="w-full flex items-center justify-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Login now</Link>
        </p>
      </motion.div>
    </div>
  );
}
