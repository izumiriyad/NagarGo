/*
# Fix auth flow: auto-create profiles on signup, fix RLS, add storage bucket

## Problems Fixed
1. No database trigger existed to auto-create a profile row when a new user signs up.
   The app manually inserted into `profiles` after `signUp()`, but the INSERT policy
   only allowed `authenticated` role — new users without a confirmed session were
   rejected, causing "Supabase not connected" style errors.
2. No storage bucket existed for rider document uploads (NID, photos).

## Changes
1. Create `handle_new_user()` SECURITY DEFINER function that inserts a profile row
   using the new user's ID, name, phone, and email from auth metadata.
2. Create `on_auth_user_created` trigger on `auth.users` that calls `handle_new_user()`.
3. Drop and recreate the `insert_own_profile` policy to also allow `anon` role
   (belt-and-suspenders: the trigger handles it server-side, but the app also
   inserts manually).
4. Create `rider-docs` storage bucket (public read, authenticated write).
5. Add storage policies for rider-docs bucket.
*/

-- 1. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix profiles INSERT policy to allow anon (for manual insert fallback)
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile"
  ON public.profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Create rider-docs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('rider-docs', 'rider-docs', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies for rider-docs
DROP POLICY IF EXISTS "rider_docs_select" ON storage.objects;
CREATE POLICY "rider_docs_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'rider-docs');

DROP POLICY IF EXISTS "rider_docs_insert" ON storage.objects;
CREATE POLICY "rider_docs_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'rider-docs' AND auth.uid() = (storage.foldername(name))[1]::uuid);

DROP POLICY IF EXISTS "rider_docs_update" ON storage.objects;
CREATE POLICY "rider_docs_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'rider-docs' AND auth.uid() = (storage.foldername(name))[1]::uuid)
  WITH CHECK (bucket_id = 'rider-docs' AND auth.uid() = (storage.foldername(name))[1]::uuid);
