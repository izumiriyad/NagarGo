'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/shared/logo';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = useCallback(async () => {
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success('Password reset link sent to your email');
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background-2 to-background-3" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass-strong rounded-2xl border border-border/60 p-8">
        <div className="flex justify-center mb-6"><Logo /></div>
        {sent ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Check Your Email</h1>
            <p className="text-sm text-muted-foreground">We sent a password reset link to {email}</p>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">Forgot Password</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Enter your email to receive a reset link</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} className="w-full pl-10 pr-4 h-11 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" placeholder="you@example.com" />
                </div>
              </div>
              <button onClick={submit} disabled={loading} className="w-full flex items-center justify-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <Link href="/login" className="block text-center text-sm text-primary hover:underline">Back to login</Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
