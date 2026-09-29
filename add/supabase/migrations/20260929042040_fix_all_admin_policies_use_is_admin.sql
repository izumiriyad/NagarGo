/*
# Replace all admin policies with is_admin() helper to prevent recursion

## Problem
All admin policies across every table use a subquery:
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
This queries the profiles table. While only profiles' own policies caused
infinite recursion (fixed in the prior migration), replacing all of them
with the SECURITY DEFINER `is_admin()` function is cleaner and faster —
one function call instead of a correlated subquery per policy evaluation.

## Changes
For every table with admin_* policies (except profiles, already fixed):
- Drop the old admin policy
- Recreate it using `public.is_admin()` instead of the subquery

Tables updated: notifications, orders, payments, payouts, policy_acceptances,
pricing_configs, reviews, riders, support_tickets, system_configs, tracking_sessions
*/

-- notifications
DROP POLICY IF EXISTS "admin_select_notifications" ON public.notifications;
CREATE POLICY "admin_select_notifications" ON public.notifications FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_notifications" ON public.notifications;
CREATE POLICY "admin_insert_notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- orders
DROP POLICY IF EXISTS "admin_select_orders" ON public.orders;
CREATE POLICY "admin_select_orders" ON public.orders FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_orders" ON public.orders;
CREATE POLICY "admin_insert_orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_orders" ON public.orders;
CREATE POLICY "admin_update_orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_orders" ON public.orders;
CREATE POLICY "admin_delete_orders" ON public.orders FOR DELETE TO authenticated USING (public.is_admin());

-- payments
DROP POLICY IF EXISTS "admin_select_payments" ON public.payments;
CREATE POLICY "admin_select_payments" ON public.payments FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_update_payments" ON public.payments;
CREATE POLICY "admin_update_payments" ON public.payments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_payments" ON public.payments;
CREATE POLICY "admin_delete_payments" ON public.payments FOR DELETE TO authenticated USING (public.is_admin());

-- payouts
DROP POLICY IF EXISTS "admin_select_payouts" ON public.payouts;
CREATE POLICY "admin_select_payouts" ON public.payouts FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_payouts" ON public.payouts;
CREATE POLICY "admin_insert_payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_payouts" ON public.payouts;
CREATE POLICY "admin_update_payouts" ON public.payouts FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- policy_acceptances
DROP POLICY IF EXISTS "admin_read_all_policy_acceptances" ON public.policy_acceptances;
CREATE POLICY "admin_read_all_policy_acceptances" ON public.policy_acceptances FOR SELECT TO authenticated USING (public.is_admin());

-- pricing_configs
DROP POLICY IF EXISTS "admin_select_pricing_configs" ON public.pricing_configs;
CREATE POLICY "admin_select_pricing_configs" ON public.pricing_configs FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_pricing_configs" ON public.pricing_configs;
CREATE POLICY "admin_insert_pricing_configs" ON public.pricing_configs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_pricing_configs" ON public.pricing_configs;
CREATE POLICY "admin_update_pricing_configs" ON public.pricing_configs FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_pricing_configs" ON public.pricing_configs;
CREATE POLICY "admin_delete_pricing_configs" ON public.pricing_configs FOR DELETE TO authenticated USING (public.is_admin());

-- reviews
DROP POLICY IF EXISTS "admin_select_reviews" ON public.reviews;
CREATE POLICY "admin_select_reviews" ON public.reviews FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_reviews" ON public.reviews;
CREATE POLICY "admin_insert_reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_reviews" ON public.reviews;
CREATE POLICY "admin_update_reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_reviews" ON public.reviews;
CREATE POLICY "admin_delete_reviews" ON public.reviews FOR DELETE TO authenticated USING (public.is_admin());

-- riders
DROP POLICY IF EXISTS "admin_select_riders" ON public.riders;
CREATE POLICY "admin_select_riders" ON public.riders FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_update_riders" ON public.riders;
CREATE POLICY "admin_update_riders" ON public.riders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_riders" ON public.riders;
CREATE POLICY "admin_delete_riders" ON public.riders FOR DELETE TO authenticated USING (public.is_admin());

-- support_tickets
DROP POLICY IF EXISTS "admin_select_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_select_support_tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_insert_support_tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_update_support_tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_delete_support_tickets" ON public.support_tickets FOR DELETE TO authenticated USING (public.is_admin());

-- system_configs
DROP POLICY IF EXISTS "admin_select_system_configs" ON public.system_configs;
CREATE POLICY "admin_select_system_configs" ON public.system_configs FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_system_configs" ON public.system_configs;
CREATE POLICY "admin_insert_system_configs" ON public.system_configs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_system_configs" ON public.system_configs;
CREATE POLICY "admin_update_system_configs" ON public.system_configs FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_system_configs" ON public.system_configs;
CREATE POLICY "admin_delete_system_configs" ON public.system_configs FOR DELETE TO authenticated USING (public.is_admin());

-- tracking_sessions
DROP POLICY IF EXISTS "admin_select_tracking_sessions" ON public.tracking_sessions;
CREATE POLICY "admin_select_tracking_sessions" ON public.tracking_sessions FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_tracking_sessions" ON public.tracking_sessions;
CREATE POLICY "admin_insert_tracking_sessions" ON public.tracking_sessions FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_tracking_sessions" ON public.tracking_sessions;
CREATE POLICY "admin_update_tracking_sessions" ON public.tracking_sessions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
