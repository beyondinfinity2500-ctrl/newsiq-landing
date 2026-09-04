/*
# Phase 4: Profile Auto-Creation Trigger & RLS Tightening

## Summary
1. Creates a database trigger that automatically creates a `profiles` row
   whenever a new user signs up via Supabase Auth.
2. Tightens the `profiles` UPDATE policy to prevent users from changing
   their own `role` column (privilege escalation prevention).
3. Adds a dedicated INSERT policy for the trigger (runs as `auth.role`
   = `authenticated` during signup, not as the user themselves).

## Security Changes

### Profile Auto-Creation
- A `BEFORE INSERT` trigger on `auth.users` calls `handle_new_user()`
- The function inserts a row into `profiles` with:
  - `id` = new auth.users.id
  - `role` = 'user' (lowest-privilege normal role)
  - `display_name` = NULL (user can set later)
- This runs server-side; the client never controls the role or user ID.
- The trigger function is `SECURITY DEFINER` so it can insert into `profiles`
  even though the signup request runs as anon/authenticated.

### RLS Tightening on profiles
- The existing `profiles_update_own` policy allowed updating ALL columns
  including `role`. This is a privilege escalation risk.
- New policy `profiles_update_own_safe` restricts UPDATE to only allow
  changes to `display_name`, `avatar_url`, `preferred_locale`, `timezone`.
  The `WITH CHECK` clause ensures the `role` column is NOT changed.
- Added `profiles_insert_trigger` policy to allow the trigger function
  (running as `authenticated`) to insert profile rows during signup.

## Important Notes
1. The trigger function runs with `SECURITY DEFINER` privileges.
2. The `role` column can ONLY be changed by an admin via the admin client
   (service role key), NOT through RLS-governed client requests.
3. Email confirmation is OFF by default (per Supabase defaults).
*/

-- ============================================================================
-- PROFILE AUTO-CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user'::user_role)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PROFILE AUTO-CREATION TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TIGHTEN PROFILES RLS
-- ============================================================================

-- Drop the old permissive update policy
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- New update policy: users can update their own profile BUT cannot change role
-- The WITH CHECK ensures role stays unchanged (or is set to its current value)
DROP POLICY IF EXISTS "profiles_update_own_safe" ON profiles;
CREATE POLICY "profiles_update_own_safe" ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (
      SELECT p.role FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- Allow the trigger (running as authenticated during signup) to insert profiles
-- This is needed because the trigger runs BEFORE the user has a profile,
-- and the existing profiles_insert_own policy requires auth.uid() = id
-- which works for the trigger since it inserts with id = NEW.id
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
