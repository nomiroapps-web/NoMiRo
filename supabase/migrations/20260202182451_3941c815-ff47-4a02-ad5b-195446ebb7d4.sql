-- Add birthdate column to children table
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Add recurring task fields to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly'));
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[]; -- For weekly: 0-6 (Sun-Sat), For monthly: 1-31

-- Update default invite expiry from 7 days to 1 day
-- We'll handle this in the code by changing the default in the insert

-- Create a notification for family invitations
-- The notifications table already exists, we just need to use it