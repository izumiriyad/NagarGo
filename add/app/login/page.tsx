'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { Logo } from '@/components/shared/logo';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isValidBdPhone } from '@/lib/format';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = useCallback(async () => {
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { toast.error(error); return; }
    toast.success('Welcome back!');
    router.push('/dashboard');
  }, [email, password, signIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background-2 to-background-3" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass-strong rounded-2xl border border-border/60 p-8">
        <div className="flex justify-center mb-6"><Logo /></div>
        <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Login to your NagarGo account</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} className="w-full pl-10 pr-4 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <button onClick={submit} disabled={loading} className="w-full flex items-center justify-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account? <Link href="/register" className="text-primary font-medium hover:underline">Register now</Link>
        </p>
      </motion.div>
    </div>
  );
}
