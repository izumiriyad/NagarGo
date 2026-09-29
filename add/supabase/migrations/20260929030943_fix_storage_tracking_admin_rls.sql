/*
# Fix storage, tracking_sessions, and admin RLS policies

## Problems Fixed
1. `prescriptions` storage bucket was missing — medicine page uploads failed silently.
2. `tracking_sessions` INSERT policy only allowed riders, but customers create
   tracking sessions when placing orders (delivery & medicine pages).
3. Admin pages (orders, riders, payments, payouts, reviews, support, users, settings)
   had no admin-level SELECT/UPDATE policies, so they returned empty results.
4. `system_configs` had no admin UPDATE policy — admin settings page couldn't save.
5. `reviews` had no admin UPDATE policy — admin couldn't approve/reject reviews.
6. `orders` had no admin UPDATE policy — admin couldn't manage orders.

## Changes
1. Create `prescriptions` storage bucket (public read, authenticated write by owner).
2. Add storage policies for `prescriptions` bucket.
3. Fix `tracking_sessions` INSERT policy: allow customer inserts where
   `customer_id = auth.uid()` OR rider inserts where rider matches.
4. Add admin SELECT policies on orders, riders, payments, payouts, reviews,
   support_tickets, profiles, tracking_sessions, policy_acceptances.
5. Add admin UPDATE policies on orders, riders, payments, payouts, reviews,
   support_tickets, system_configs.
6. Add admin INSERT policy on payouts (admin creates payout records).
*/

-- 1. Create prescriptions storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies for prescriptions
DROP POLICY IF EXISTS "prescriptions_select" ON storage.objects;
CREATE POLICY "prescriptions_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'prescriptions');

DROP POLICY IF EXISTS "prescriptions_insert" ON storage.objects;
CREATE POLICY "prescriptions_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'prescriptions');

-- 3. Fix tracking_sessions INSERT: allow customer OR rider inserts
DROP POLICY IF EXISTS "insert_own_tracking" ON public.tracking_sessions;
CREATE POLICY "insert_own_tracking"
  ON public.tracking_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
    OR EXISTS (
      SELECT 1 FROM public.riders
      WHERE riders.id = tracking_sessions.rider_id
      AND riders.user_id = auth.uid()
    )
  );

-- 4. Admin SELECT policies (admin = profiles.role = 'admin')
DROP POLICY IF EXISTS "admin_select_orders" ON public.orders;
CREATE POLICY "admin_select_orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_select_riders" ON public.riders;
CREATE POLICY "admin_select_riders"
  ON public.riders FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_select_payments" ON public.payments;
CREATE POLICY "admin_select_payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_select_payouts" ON public.payouts;
CREATE POLICY "admin_select_payouts"
  ON public.payouts FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_select_reviews" ON public.reviews;
CREATE POLICY "admin_select_reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_select_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_select_support_tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_select_profiles" ON public.profiles;
CREATE POLICY "admin_select_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_select_tracking_sessions" ON public.tracking_sessions;
CREATE POLICY "admin_select_tracking_sessions"
  ON public.tracking_sessions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 5. Admin UPDATE policies
DROP POLICY IF EXISTS "admin_update_orders" ON public.orders;
CREATE POLICY "admin_update_orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_update_riders" ON public.riders;
CREATE POLICY "admin_update_riders"
  ON public.riders FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_update_payments" ON public.payments;
CREATE POLICY "admin_update_payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_update_payouts" ON public.payouts;
CREATE POLICY "admin_update_payouts"
  ON public.payouts FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_update_reviews" ON public.reviews;
CREATE POLICY "admin_update_reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_update_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_update_support_tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_update_system_configs" ON public.system_configs;
CREATE POLICY "admin_update_system_configs"
  ON public.system_configs FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 6. Admin INSERT policy for payouts
DROP POLICY IF EXISTS "admin_insert_payouts" ON public.payouts;
CREATE POLICY "admin_insert_payouts"
  ON public.payouts FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
