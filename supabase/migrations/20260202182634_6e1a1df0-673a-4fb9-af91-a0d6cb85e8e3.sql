-- Update family_invitations default expiry to 1 day
ALTER TABLE public.family_invitations 
ALTER COLUMN expires_at SET DEFAULT (now() + interval '1 day');