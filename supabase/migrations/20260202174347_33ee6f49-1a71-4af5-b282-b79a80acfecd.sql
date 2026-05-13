-- Add email column to children table
ALTER TABLE public.children ADD COLUMN email TEXT;

-- Create family invitations table for parent invites
CREATE TABLE public.family_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- Family members can view invitations for their family
CREATE POLICY "Family members can view invitations"
ON public.family_invitations
FOR SELECT
USING (public.is_family_member(family_id, auth.uid()));

-- Family owner can create invitations
CREATE POLICY "Family owner can create invitations"
ON public.family_invitations
FOR INSERT
WITH CHECK (public.is_family_owner(family_id, auth.uid()));

-- Family owner can update/cancel invitations
CREATE POLICY "Family owner can update invitations"
ON public.family_invitations
FOR UPDATE
USING (public.is_family_owner(family_id, auth.uid()));

-- Anyone can view their own invitation by token (for accepting)
CREATE POLICY "Users can view invitations sent to their email"
ON public.family_invitations
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_family_invitations_token ON public.family_invitations(token);
CREATE INDEX idx_family_invitations_email ON public.family_invitations(email);
CREATE INDEX idx_family_invitations_family_id ON public.family_invitations(family_id);