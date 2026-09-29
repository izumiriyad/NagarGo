'use client';

import { useState, useCallback } from 'react';
import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LifeBuoy, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { notifyTelegramSupportTicket } from '@/lib/telegram';

const categories = [
  { id: 'complaint', label: 'Complaint' },
  { id: 'payment_issue', label: 'Payment Issue' },
  { id: 'rider_issue', label: 'Rider Issue' },
  { id: 'delivery_issue', label: 'Delivery Issue' },
  { id: 'refund_request', label: 'Refund Request' },
  { id: 'medicine_issue', label: 'Medicine Issue' },
  { id: 'technical_issue', label: 'Technical Issue' },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'complaint', description: '' });

  const submit = useCallback(async () => {
    if (!user) { toast.error('Please login to submit a support ticket'); return; }
    if (!form.subject || !form.description) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('support_tickets').insert({
        ticket_id: ticketId, user_id: user.id, subject: form.subject,
        category: form.category, description: form.description, status: 'open',
      });
      if (error) throw error;
      toast.success(`Ticket ${ticketId} created. We will respond soon.`);
      notifyTelegramSupportTicket({
        ticket_id: ticketId,
        subject: form.subject,
        category: form.category,
        description: form.description,
      });
      setForm({ subject: '', category: 'complaint', description: '' });
    } catch (err: any) { toast.error(err.message || 'Failed to submit ticket'); } finally { setLoading(false); }
  }, [user, form]);

  return (
    <SiteLayout>
      <PageHeader title="Support Center" subtitle="Need help? Create a support ticket and our team will assist you." icon={<LifeBuoy className="w-8 h-8 text-primary" />} />

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-border/60 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject</label>
            <input type="text" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((c) => (
                <button key={c.id} onClick={() => setForm((f) => ({ ...f, category: c.id }))} className={`px-3 h-10 rounded-md border text-xs font-medium transition-all ${form.category === c.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/30'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 h-32 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
          </div>
          <button onClick={submit} disabled={loading || !user} className="w-full flex items-center justify-center gap-2 px-5 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
          {!user && <p className="text-center text-sm text-muted-foreground">Please login to submit a support ticket.</p>}
        </motion.div>

        <div className="mt-6 glass rounded-xl border border-border/60 p-6">
          <h3 className="font-semibold mb-3">Other Contact Options</h3>
          <div className="space-y-3">
            <a href="https://t.me/SouraksPizzaPro" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/30 transition-colors">
              <Send className="w-5 h-5 text-primary" />
              <div><p className="text-sm font-medium">Telegram</p><p className="text-xs text-muted-foreground">@SouraksPizzaPro</p></div>
            </a>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
