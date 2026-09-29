/*
# Fix remaining policy gaps: pricing_configs admin access, orders rider SELECT, DELETE policies

## Problems Fixed
1. `pricing_configs` had no admin UPDATE policy — admin pricing page couldn't save changes.
   The select_pricing policy only allows SELECT where is_active=true, so admin sees all rows
   but can't update them.
2. `pricing_configs` SELECT was filtered to is_active=true only — admin needs to see ALL rows
   (including inactive ones). Added admin_select_pricing policy.
3. `orders` had no policy for riders to see available (unassigned) orders — the rider requests
   page queries orders where status IN ('requested','searching_rider') AND rider_id IS NULL,
   but no policy allowed riders to SELECT those unassigned rows.
4. `orders` had no admin INSERT policy (not needed now but added for completeness).
5. Missing DELETE policies on orders, riders, reviews, support_tickets, payments for admin.

## Changes
1. Add admin UPDATE policy on pricing_configs.
2. Add admin SELECT policy on pricing_configs (sees all rows, not just active).
3. Add rider SELECT policy on orders for available (unassigned, requested/searching) orders.
4. Add admin DELETE policies on orders, riders, reviews, support_tickets, payments.
5. Add admin INSERT policy on orders.
*/

-- 1. Admin UPDATE on pricing_configs
DROP POLICY IF EXISTS "admin_update_pricing_configs" ON public.pricing_configs;
CREATE POLICY "admin_update_pricing_configs"
  ON public.pricing_configs FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 2. Admin SELECT on pricing_configs (all rows, not just active)
DROP POLICY IF EXISTS "admin_select_pricing_configs" ON public.pricing_configs;
CREATE POLICY "admin_select_pricing_configs"
  ON public.pricing_configs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3. Riders can see available (unassigned) orders
DROP POLICY IF EXISTS "select_available_orders" ON public.orders;
CREATE POLICY "select_available_orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    rider_id IS NULL
    AND status IN ('requested', 'searching_rider')
    AND EXISTS (
      SELECT 1 FROM public.riders
      WHERE riders.user_id = auth.uid()
      AND riders.status = 'approved'
    )
  );

-- 4. Admin DELETE policies
DROP POLICY IF EXISTS "admin_delete_orders" ON public.orders;
CREATE POLICY "admin_delete_orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_riders" ON public.riders;
CREATE POLICY "admin_delete_riders"
  ON public.riders FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_reviews" ON public.reviews;
CREATE POLICY "admin_delete_reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_delete_support_tickets"
  ON public.support_tickets FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_payments" ON public.payments;
CREATE POLICY "admin_delete_payments"
  ON public.payments FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 5. Admin INSERT on orders
DROP POLICY IF EXISTS "admin_insert_orders" ON public.orders;
CREATE POLICY "admin_insert_orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
