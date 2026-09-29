/*
# Create policy_acceptances table for Terms/Privacy/Safety agreement tracking

1. New Tables
- `policy_acceptances`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, nullable for anonymous acceptances)
  - `policy_version` (text, not null — e.g. "2026.09.27")
  - `accepted` (boolean, default true)
  - `accepted_at` (timestamptz, default now())
  - `source` (text, default 'web')
  - `created_at` (timestamptz, default now())

2. Purpose
- Tracks which users have accepted the NagarGo Terms, Conditions, Safety & Privacy Agreement
- Versioned: when the policy version changes, users must re-accept
- Anonymous (logged-out) users are tracked via localStorage only
- Logged-in users have their acceptance persisted here

3. Security
- RLS enabled
- Users can read only their own acceptance records
- Users can insert only their own acceptance records (user_id defaults to auth.uid())
- Admins can read all records (via admin role check)
- No update/delete from client — acceptance is append-only

4. Index
- Index on user_id for fast lookups
- Unique constraint on (user_id, policy_version) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS policy_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  policy_version text NOT NULL,
  accepted boolean NOT NULL DEFAULT true,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE policy_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_policy_acceptances" ON policy_acceptances;
CREATE POLICY "select_own_policy_acceptances"
ON policy_acceptances FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_policy_acceptances" ON policy_acceptances;
CREATE POLICY "insert_own_policy_acceptances"
ON policy_acceptances FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_read_all_policy_acceptances" ON policy_acceptances;
CREATE POLICY "admin_read_all_policy_acceptances"
ON policy_acceptances FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_policy_acceptances_user_id ON policy_acceptances(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_acceptances_user_version ON policy_acceptances(user_id, policy_version);
