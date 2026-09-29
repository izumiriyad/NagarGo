/*
# Fix storage policies: foldername index off-by-one, prescriptions owner-scoped

## Root Cause
The rider-docs INSERT/UPDATE policies check:
  auth.uid() = (storage.foldername(name))[1]::uuid

PostgreSQL arrays are 1-indexed, so foldername('riders/<uuid>/file.jpg')
returns ['riders', '<uuid>'] and [1] = 'riders' (a text, not a uuid).
The ::uuid cast fails silently, so every upload is rejected by RLS.

The rider page uploads to path: riders/<user_id>/<key>.<ext>
The medicine page uploads to path: prescriptions/<user_id>/<order_id>.<ext>

## Fix
1. rider-docs: change [1] → [2] to match the <user_id> at index 2
2. prescriptions: add owner-scoped INSERT/UPDATE policies using [2] for <user_id>
3. Also fix the prescriptions SELECT — was open to all, keep public read since
   the bucket is public and prescription URLs are shared via Telegram
*/

-- 1. Fix rider-docs INSERT policy
DROP POLICY IF EXISTS "rider_docs_insert" ON storage.objects;
CREATE POLICY "rider_docs_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rider-docs'
    AND auth.uid() = (storage.foldername(name))[2]::uuid
  );

-- 2. Fix rider-docs UPDATE policy
DROP POLICY IF EXISTS "rider_docs_update" ON storage.objects;
CREATE POLICY "rider_docs_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'rider-docs'
    AND auth.uid() = (storage.foldername(name))[2]::uuid
  )
  WITH CHECK (
    bucket_id = 'rider-docs'
    AND auth.uid() = (storage.foldername(name))[2]::uuid
  );

-- 3. rider-docs DELETE policy (owner can delete own docs)
DROP POLICY IF EXISTS "rider_docs_delete" ON storage.objects;
CREATE POLICY "rider_docs_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'rider-docs'
    AND auth.uid() = (storage.foldername(name))[2]::uuid
  );

-- 4. Fix prescriptions INSERT policy — owner-scoped
DROP POLICY IF EXISTS "prescriptions_insert" ON storage.objects;
CREATE POLICY "prescriptions_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'prescriptions'
    AND auth.uid() = (storage.foldername(name))[2]::uuid
  );

-- 5. prescriptions UPDATE policy — owner-scoped
DROP POLICY IF EXISTS "prescriptions_update" ON storage.objects;
CREATE POLICY "prescriptions_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'prescriptions'
    AND auth.uid() = (storage.foldername(name))[2]::uuid
  )
  WITH CHECK (
    bucket_id = 'prescriptions'
    AND auth.uid() = (storage.foldername(name))[2]::uuid
  );

-- 6. prescriptions DELETE policy — owner-scoped
DROP POLICY IF EXISTS "prescriptions_delete" ON storage.objects;
CREATE POLICY "prescriptions_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'prescriptions'
    AND auth.uid() = (storage.foldername(name))[2]::uuid
  );

-- 7. Revoke EXECUTE on handle_new_user from anon and authenticated
-- This function is a trigger function, it should only be called by the trigger,
-- not directly via the REST API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
