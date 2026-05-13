-- Fix the generate_2fa_code function to have search_path set
CREATE OR REPLACE FUNCTION public.generate_2fa_code()
RETURNS TEXT
LANGUAGE sql
SET search_path = public
AS $$
  SELECT lpad(floor(random() * 1000000)::text, 6, '0');
$$;

-- Add a dummy policy for password_reset_tokens 
-- This table is only accessed via service role key from edge functions
-- We add a false policy to satisfy the linter while keeping it secure
CREATE POLICY "No direct access - service role only"
  ON password_reset_tokens
  FOR ALL
  USING (false)
  WITH CHECK (false);