'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield, CheckCircle, X, Loader2 } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { POLICY_VERSION, POLICY_LAST_UPDATED, POLICY_STORAGE_KEY, policySections } from '@/lib/policy/policy-data';

export function AgreementGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const checkAcceptance = useCallback(async () => {
    if (authLoading) return;

    if (user) {
      const { data } = await supabase
        .from('policy_acceptances')
        .select('policy_version')
        .eq('user_id', user.id)
        .eq('policy_version', POLICY_VERSION)
        .maybeSingle();

      if (data) {
        setShowModal(false);
        setChecking(false);
        return;
      }
    }

    const stored = localStorage.getItem(POLICY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.accepted && parsed.policyVersion === POLICY_VERSION) {
          setShowModal(false);
          setChecking(false);
          return;
        }
      } catch {}
    }

    setShowModal(true);
    setChecking(false);
  }, [user, authLoading]);

  useEffect(() => {
    checkAcceptance();
  }, [checkAcceptance]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      if (user) {
        await supabase.from('policy_acceptances').upsert({
          user_id: user.id,
          policy_version: POLICY_VERSION,
          accepted: true,
          source: 'web',
        }, { onConflict: 'user_id,policy_version' });
      }

      localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify({
        accepted: true,
        policyVersion: POLICY_VERSION,
        acceptedAt: new Date().toISOString(),
        source: 'web',
      }));

      setShowModal(false);
      toast.success('Welcome to NagarGo!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 border-primary text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {showModal && <AgreementModal onAccept={handleAccept} accepting={accepting} />}
      </AnimatePresence>
    </>
  );
}

function AgreementModal({ onAccept, accepting }: { onAccept: () => void; accepting: boolean }) {
  const [agreed, setAgreed] = useState(false);
  const [exited, setExited] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (checkboxRef.current && !exited) {
      checkboxRef.current.focus();
    }
  }, [exited]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollProgress(max > 0 ? (el.scrollTop / max) * 100 : 100);
  };

  const preventClose = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', preventClose, true);
    return () => window.removeEventListener('keydown', preventClose, true);
  }, []);

  if (exited) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background flex items-center justify-center px-4"
      >
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-3">You must accept the NagarGo policies to use our services.</h2>
          <p className="text-sm text-muted-foreground mb-6">Please review and accept the Terms, Safety & Privacy Policy to continue.</p>
          <button
            onClick={() => setExited(false)}
            className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all"
          >
            <Shield className="w-5 h-5" /> Review Agreement
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agreement-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border/60 shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        {/* Scroll progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-border/40 z-20">
          <div className="h-full bg-primary transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
        </div>

        {/* Sticky header */}
        <div className="sticky top-0 z-10 p-5 sm:p-6 border-b border-border/50" style={{ backgroundColor: 'hsl(var(--card))' }}>
          <div className="flex flex-col items-center text-center">
            <Logo />
            <h2 id="agreement-title" className="text-xl sm:text-2xl font-bold mt-4" style={{ fontFamily: 'var(--font-display), system-ui' }}>
              Welcome to NagarGo
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
              Please review and accept our Terms, Safety &amp; Privacy Policy to continue.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Last updated: {POLICY_LAST_UPDATED}</p>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3"
        >
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm text-muted-foreground leading-relaxed">
            NagarGo is a technology-enabled transportation, delivery, ride, and logistics platform. By using NagarGo, you acknowledge that you have read, understood, and agreed to the following Terms, Safety Guidelines, Privacy Rules, and Platform Policies. If you do not agree, you must not use NagarGo.
          </div>

          {policySections.map((section) => (
            <AccordionSection key={section.number} section={section} />
          ))}

          <div className="rounded-lg bg-secondary/40 border border-border/60 p-4">
            <h3 className="text-sm font-bold mb-2">27. Acceptance</h3>
            <p className="text-xs text-muted-foreground mb-3">By clicking &ldquo;I Agree &amp; Continue&rdquo; you confirm that:</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {[
                'You have read the NagarGo Terms & Conditions.',
                'You understand the Safety Guidelines.',
                'You understand the Privacy Policy.',
                'You agree to follow NagarGo\u2019s platform rules.',
                'You understand that certain services require location and other permissions.',
                'You understand NagarGo cannot guarantee every trip or delivery will be risk-free.',
                'You confirm the information you provide is accurate to the best of your knowledge.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2">
            <Link href="/privacy" className="text-xs text-primary hover:underline mr-4">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-primary hover:underline mr-4">Terms &amp; Conditions</Link>
            <Link href="/location-policy" className="text-xs text-primary hover:underline">Location &amp; GPS Privacy</Link>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 p-4 sm:p-5 border-t border-border/50" style={{ backgroundColor: 'hsl(var(--card))' }}>
          <button
            ref={checkboxRef}
            role="checkbox"
            aria-checked={agreed}
            onClick={() => setAgreed(!agreed)}
            className="flex items-center gap-3 w-full text-left mb-3 group"
          >
            <span className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreed ? 'bg-primary border-primary' : 'border-border/60 group-hover:border-primary/50'}`}>
              {agreed && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground leading-snug">
              I have read and agree to the NagarGo Terms, Conditions, Safety Guidelines and Privacy Policy.
            </span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={onAccept}
              disabled={!agreed || accepting}
              className="flex-1 flex items-center justify-center gap-2 px-4 h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-bright disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {accepting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              {accepting ? 'Accepting...' : 'I Agree & Continue'}
            </button>
            <button
              onClick={() => setExited(true)}
              className="flex items-center justify-center gap-2 px-5 h-12 rounded-lg border border-border/60 text-sm font-medium hover:bg-secondary/40 transition-all"
            >
              <X className="w-4 h-4" /> Exit
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className} onClick={(e) => e.stopPropagation()}>{children}</a>
  );
}

function AccordionSection({ section }: { section: { number: string; title: string; content: string[] } }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-secondary/30 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-medium">
          <span className="text-primary mr-2">{section.number}.</span>
          {section.title}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-1 space-y-2">
              {section.content.map((text, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">{text}</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
