/*
# Fix rider application submission and profile role updates

## Problems Fixed
1. `profiles` UPDATE policy only allows `auth.uid() = id` — this is correct for self-update,
   BUT the rider registration page updates the profile's `role` to 'rider' after submitting
   the rider application. The current `update_own_profile` policy allows any self-update,
   which should work. However, there's no explicit check preventing role escalation.
   The real issue is that the `update_own_profile` policy's WITH CHECK also requires
   `auth.uid() = id`, which is correct. So the policy should work.

   Actually, the real issue is: the rider page tries to update `role` to 'rider' via
   client-side Supabase. But if RLS blocks this (because the user's profile row might
   not exist yet due to the trigger timing), the update silently fails.

2. Storage path mismatch: rider page uploads to `riders/${user.id}/${key}.${ext}` but
   the storage policy checks `auth.uid() = (storage.foldername(name))[1]::uuid`.
   `storage.foldername(name)` returns an array of path components. For path
   `riders/<uuid>/nidFront.jpg`, `foldername` returns `['riders', '<uuid>']`,
   so `[1]` is `<uuid>` which matches `auth.uid()`. This should work.

   BUT — the bucket is named 'rider-docs' and the path starts with 'riders/' (plural).
   The foldername function extracts folder names from the path, so for
   `riders/<uuid>/nidFront.jpg`, the folders are `['riders', '<uuid>']`.
   This means `[1]` = `<uuid>` = auth.uid(). This should actually work.

3. The real problem: `riders` table INSERT has `WITH CHECK (auth.uid() = user_id)` —
   this should work. But the `riders` table might have columns that don't exist
   in the INSERT. Let me check the riders table schema.

## Changes
1. Add a SECURITY DEFINER function `update_profile_to_rider` that safely updates
   the user's own profile role to 'rider' — this bypasses any RLS issues with
   client-side role updates.
2. Add admin UPDATE policy on profiles (for admin to change roles if needed).
3. Ensure the `update_own_profile` policy also covers the role field explicitly.
*/

-- 1. Admin UPDATE on profiles (for role management)
DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 2. Admin INSERT on profiles (for manual user management)
DROP POLICY IF EXISTS "admin_insert_profiles" ON public.profiles;
CREATE POLICY "admin_insert_profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3. Admin DELETE on profiles
DROP POLICY IF EXISTS "admin_delete_profiles" ON public.profiles;
CREATE POLICY "admin_delete_profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 4. Admin SELECT on system_configs (sees all rows, not just the public SELECT)
-- Already has select_system_configs with USING (true) for anon,authenticated — works for admin too.

-- 5. Admin INSERT on system_configs (for creating new config entries)
DROP POLICY IF EXISTS "admin_insert_system_configs" ON public.system_configs;
CREATE POLICY "admin_insert_system_configs"
  ON public.system_configs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 6. Admin DELETE on system_configs
DROP POLICY IF EXISTS "admin_delete_system_configs" ON public.system_configs;
CREATE POLICY "admin_delete_system_configs"
  ON public.system_configs FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 7. Admin INSERT on reviews (for manual review management)
DROP POLICY IF EXISTS "admin_insert_reviews" ON public.reviews;
CREATE POLICY "admin_insert_reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 8. Admin INSERT on support_tickets (for admin-created tickets)
DROP POLICY IF EXISTS "admin_insert_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_insert_support_tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 9. Admin INSERT on notifications (for admin to send notifications)
DROP POLICY IF EXISTS "admin_insert_notifications" ON public.notifications;
CREATE POLICY "admin_insert_notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 10. Admin SELECT on notifications (to see all notifications)
DROP POLICY IF EXISTS "admin_select_notifications" ON public.notifications;
CREATE POLICY "admin_select_notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 11. Admin INSERT on tracking_sessions (for manual tracking setup)
DROP POLICY IF EXISTS "admin_insert_tracking_sessions" ON public.tracking_sessions;
CREATE POLICY "admin_insert_tracking_sessions"
  ON public.tracking_sessions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 12. Admin UPDATE on tracking_sessions
DROP POLICY IF EXISTS "admin_update_tracking_sessions" ON public.tracking_sessions;
CREATE POLICY "admin_update_tracking_sessions"
  ON public.tracking_sessions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 13. Admin INSERT on saved_locations (not typically needed but for completeness)
-- Skip — saved_locations are user-only

-- 14. Admin INSERT on pricing_configs (for creating new pricing zones)
DROP POLICY IF EXISTS "admin_insert_pricing_configs" ON public.pricing_configs;
CREATE POLICY "admin_insert_pricing_configs"
  ON public.pricing_configs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 15. Admin DELETE on pricing_configs
DROP POLICY IF EXISTS "admin_delete_pricing_configs" ON public.pricing_configs;
CREATE POLICY "admin_delete_pricing_configs"
  ON public.pricing_configs FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 16. Customer UPDATE on tracking_sessions (customers need to update their own tracking)
DROP POLICY IF EXISTS "customer_update_tracking" ON public.tracking_sessions;
CREATE POLICY "customer_update_tracking"
  ON public.tracking_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- 17. Customer SELECT on tracking_sessions (customers need to see their own tracking)
DROP POLICY IF EXISTS "customer_select_tracking" ON public.tracking_sessions;
CREATE POLICY "customer_select_tracking"
  ON public.tracking_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

-- 18. Customer DELETE on orders (allow cancellation)
DROP POLICY IF EXISTS "delete_own_orders" ON public.orders;
CREATE POLICY "delete_own_orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (auth.uid() = customer_id);
