-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view families they belong to" ON families;

-- Create a simpler policy that avoids recursion
-- Users can view families they own directly
CREATE POLICY "Users can view their own families"
  ON families
  FOR SELECT
  USING (owner_id = auth.uid());

-- Create a separate policy for family members access
-- This uses a direct join without recursion
CREATE POLICY "Family members can view families"
  ON families
  FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );