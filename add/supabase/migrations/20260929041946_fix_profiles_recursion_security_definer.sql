/*
# Fix infinite recursion in profiles policies using SECURITY DEFINER function

## Problem
The previous migration (fix_profiles_recursion_and_rider_flow) replaced the
self-referential subquery with `auth.jwt() ->> 'role'`, but the `role` value
is only stored in `public.profiles`, NOT in `raw_app_meta_data` (JWT claims).
So the JWT check always returns NULL → admin policies never match.

## Fix
Create a `public.is_admin()` SECURITY DEFINER function that checks the role
in `profiles`. Because it runs with the function owner's privileges (bypassing
RLS), querying `profiles` inside it does NOT trigger the profiles RLS policies,
breaking the infinite recursion.

Then update all 4 admin policies to call `public.is_admin()` instead of any
subquery on `profiles` or JWT claim.
*/

-- 1. Create is_admin() helper (SECURITY DEFINER = bypasses RLS, no recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Admin SELECT policy
DROP POLICY IF EXISTS "admin_select_profiles" ON public.profiles;
CREATE POLICY "admin_select_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 3. Admin INSERT policy
DROP POLICY IF EXISTS "admin_insert_profiles" ON public.profiles;
CREATE POLICY "admin_insert_profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 4. Admin UPDATE policy
DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Admin DELETE policy
DROP POLICY IF EXISTS "admin_delete_profiles" ON public.profiles;
CREATE POLICY "admin_delete_profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());
