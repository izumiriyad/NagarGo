/*
# Add rejection_reason columns + telegram_pending_actions table

## Changes
1. Add `rejection_reason` column to riders, payments, payouts tables
2. Create `telegram_pending_actions` table to track rejection flows needing a reason
   - When admin taps "Deny" on Telegram, we store a pending action and ask for a reason via force_reply
   - When admin sends the text reply, we match it to the pending action and save the rejection_reason
3. RLS: users can read their own rejection reasons; admin can read all via is_admin()
*/

ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE TABLE IF NOT EXISTS public.telegram_pending_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  entity_id text NOT NULL,
  entity_table text NOT NULL,
  telegram_message_id bigint,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.telegram_pending_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_pending_actions" ON public.telegram_pending_actions;
CREATE POLICY "admin_select_pending_actions" ON public.telegram_pending_actions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_pending_actions" ON public.telegram_pending_actions;
CREATE POLICY "admin_insert_pending_actions" ON public.telegram_pending_actions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_pending_actions" ON public.telegram_pending_actions;
CREATE POLICY "admin_update_pending_actions" ON public.telegram_pending_actions
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_pending_actions" ON public.telegram_pending_actions;
CREATE POLICY "admin_delete_pending_actions" ON public.telegram_pending_actions
  FOR DELETE TO authenticated USING (public.is_admin());
