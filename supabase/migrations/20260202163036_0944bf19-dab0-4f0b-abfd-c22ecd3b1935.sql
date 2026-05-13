-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'task_assigned',
  'task_completed', 
  'task_verified',
  'task_rejected',
  'reward_requested',
  'reward_approved',
  'reward_denied',
  'points_earned',
  'achievement_unlocked',
  'reminder'
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    icon TEXT DEFAULT 'bell',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    related_reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
    related_child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- System/users can create notifications for themselves
CREATE POLICY "Users can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;