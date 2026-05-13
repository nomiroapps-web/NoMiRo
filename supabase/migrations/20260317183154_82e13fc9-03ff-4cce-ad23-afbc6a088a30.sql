
-- Enable pgcrypto (may already exist)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Function to verify a child PIN
CREATE OR REPLACE FUNCTION public.verify_child_pin(
  _child_id uuid,
  _pin text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM children
    WHERE id = _child_id
      AND pin_code = crypt(_pin, pin_code)
  );
$$;

-- Function to set a child PIN (hashes it)
CREATE OR REPLACE FUNCTION public.set_child_pin(
  _child_id uuid,
  _pin text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE children
  SET pin_code = crypt(_pin, gen_salt('bf'))
  WHERE id = _child_id;
END;
$$;
