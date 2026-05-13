-- Add phone_number and 2FA fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_code TEXT,
ADD COLUMN IF NOT EXISTS two_factor_code_expires_at TIMESTAMPTZ;

-- Create an index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);

-- Create a password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert/update/delete tokens (handled by edge functions)
-- Users should never directly access this table from client

-- Create function to generate and validate 2FA codes
CREATE OR REPLACE FUNCTION public.generate_2fa_code()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT lpad(floor(random() * 1000000)::text, 6, '0');
$$;

-- Add UPDATE policy for profiles to allow users to update their own profile (2FA fields)
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);