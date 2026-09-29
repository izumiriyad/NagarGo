/*
# Fix rider order acceptance and tracking session updates

## Problems Fixed
1. Riders cannot claim available orders. The `update_rider_orders` policy checks
   `riders.id = orders.rider_id`, but when accepting an order, rider_id is NULL.
   Need a separate UPDATE policy that allows approved riders to claim unassigned orders.

2. `tracking_sessions` has `update_own_tracking` which checks rider match via
   `riders.id = tracking_sessions.rider_id`, but the rider order detail page
   doesn't update tracking_sessions at all. The tracking session's rider_id
   is also NULL when the order is first created (customer creates it before
   a rider is assigned). Need a policy that allows the assigned rider to
   update tracking_sessions where rider_id matches their rider record,
   AND a policy that allows updating when rider_id IS NULL (rider claiming).

## Changes
1. Add `claim_available_order` UPDATE policy: approved riders can update orders
   where rider_id IS NULL (to set rider_id and status).
2. Add `rider_update_tracking` UPDATE policy: assigned rider can update
   tracking_sessions through the orders table relationship.
3. Add `rider_select_tracking` SELECT policy: assigned rider can view
   tracking_sessions for their orders.
4. Add rider INSERT policy on tracking_sessions so riders can create
   tracking entries when they pick up.
*/

-- 1. Allow approved riders to claim (update) unassigned orders
DROP POLICY IF EXISTS "claim_available_order" ON public.orders;
CREATE POLICY "claim_available_order"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    rider_id IS NULL
    AND status IN ('requested', 'searching_rider')
    AND EXISTS (
      SELECT 1 FROM public.riders
      WHERE riders.user_id = auth.uid()
      AND riders.status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.riders
      WHERE riders.user_id = auth.uid()
      AND riders.status = 'approved'
    )
  );

-- 2. Allow assigned rider to update tracking_sessions via order relationship
DROP POLICY IF EXISTS "rider_update_tracking" ON public.tracking_sessions;
CREATE POLICY "rider_update_tracking"
  ON public.tracking_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.riders r
      JOIN public.orders o ON o.id = tracking_sessions.order_id
      WHERE r.user_id = auth.uid()
      AND (r.id = o.rider_id OR tracking_sessions.rider_id = r.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.riders r
      JOIN public.orders o ON o.id = tracking_sessions.order_id
      WHERE r.user_id = auth.uid()
      AND (r.id = o.rider_id OR tracking_sessions.rider_id = r.id)
    )
  );

-- 3. Allow assigned rider to view tracking_sessions for their orders
DROP POLICY IF EXISTS "rider_select_tracking" ON public.tracking_sessions;
CREATE POLICY "rider_select_tracking"
  ON public.tracking_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.riders r
      JOIN public.orders o ON o.id = tracking_sessions.order_id
      WHERE r.user_id = auth.uid()
      AND r.id = o.rider_id
    )
  );

-- 4. Allow riders to insert tracking_sessions for orders assigned to them
DROP POLICY IF EXISTS "rider_insert_tracking" ON public.tracking_sessions;
CREATE POLICY "rider_insert_tracking"
  ON public.tracking_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.riders r
      WHERE r.user_id = auth.uid()
      AND r.id = tracking_sessions.rider_id
    )
  );
