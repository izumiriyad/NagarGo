/*
# Fix infinite recursion in profiles policies + rider registration flow

## Problems Fixed
1. **Infinite recursion in profiles RLS policies**: The admin_*_profiles policies
   queried `profiles` inside the policy predicate (`SELECT 1 FROM profiles WHERE
   profiles.id = auth.uid() AND profiles.role = 'admin'`). When ANY query hits
   the profiles table, Postgres evaluates the SELECT policy, which itself queries
   profiles, triggering the same policy again → infinite recursion (error 42P17).

   Fix: Replace the subquery on `profiles` with a check on `auth.jwt() ->> 'role'`
   from `raw_app_meta_data`, which is set by the handle_new_user trigger and is
   immutable by the user. No self-referential query means no recursion.

2. **Rider registration FK violation**: The rider page inserts into `riders`
   (which has `user_id REFERENCES profiles(id)`) BEFORE updating the profile row.
   If the profile doesn't exist yet (trigger hasn't run or race condition), the
   FK constraint fails. The frontend should update the profile FIRST, then insert
   the rider row. This migration doesn't change the FK — the frontend fix handles it.

## Changes
1. Drop and recreate all 4 admin profiles policies using `auth.jwt() ->> 'role'`
   instead of a subquery on profiles.
2. No schema changes — policies only.
*/

-- 1. Fix admin SELECT policy (no self-reference)
DROP POLICY IF EXISTS "admin_select_profiles" ON public.profiles;
CREATE POLICY "admin_select_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- 2. Fix admin INSERT policy
DROP POLICY IF EXISTS "admin_insert_profiles" ON public.profiles;
CREATE POLICY "admin_insert_profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- 3. Fix admin UPDATE policy
DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- 4. Fix admin DELETE policy
DROP POLICY IF EXISTS "admin_delete_profiles" ON public.profiles;
CREATE POLICY "admin_delete_profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');
