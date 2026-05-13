-- Create a security definer function to check family membership
-- This bypasses RLS on the family_members table to avoid recursion
CREATE OR REPLACE FUNCTION public.is_family_member(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = _family_id
      AND user_id = _user_id
  )
$$;

-- Create a security definer function to check family ownership
CREATE OR REPLACE FUNCTION public.is_family_owner(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.families
    WHERE id = _family_id
      AND owner_id = _user_id
  )
$$;

-- Drop the problematic policy on families
DROP POLICY IF EXISTS "Family members can view families" ON families;

-- Create a new non-recursive policy using the security definer function
CREATE POLICY "Family members can view families"
  ON families
  FOR SELECT
  USING (public.is_family_member(id, auth.uid()));

-- Drop and recreate the family_members SELECT policy to use the security definer function
DROP POLICY IF EXISTS "Members can view family members" ON family_members;

CREATE POLICY "Members can view family members"
  ON family_members
  FOR SELECT
  USING (
    public.is_family_owner(family_id, auth.uid())
    OR user_id = auth.uid()
  );

-- Fix INSERT policy on family_members
DROP POLICY IF EXISTS "Family owners can add members" ON family_members;

CREATE POLICY "Family owners can add members"
  ON family_members
  FOR INSERT
  WITH CHECK (public.is_family_owner(family_id, auth.uid()));

-- Fix DELETE policy on family_members
DROP POLICY IF EXISTS "Family owners can remove members" ON family_members;

CREATE POLICY "Family owners can remove members"
  ON family_members
  FOR DELETE
  USING (public.is_family_owner(family_id, auth.uid()));