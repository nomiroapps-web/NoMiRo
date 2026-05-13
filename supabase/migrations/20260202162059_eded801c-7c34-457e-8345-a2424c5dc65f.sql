-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('parent', 'child');

-- Create task category enum
CREATE TYPE public.task_category AS ENUM ('cleaning', 'organizing', 'pet_care', 'meal_help', 'yard_work', 'self_care', 'homework', 'other');

-- Create task difficulty enum
CREATE TYPE public.task_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'completed', 'verified', 'rejected');

-- Create reward category enum
CREATE TYPE public.reward_category AS ENUM ('screen_time', 'privileges', 'toys', 'outings', 'treats', 'money', 'other');

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'parent',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create families table
CREATE TABLE public.families (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    point_to_currency_rate DECIMAL(10,2) DEFAULT 0.05,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family members junction table
CREATE TABLE public.family_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'parent',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(family_id, user_id)
);

-- Create children profiles (for child-specific data)
CREATE TABLE public.children (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    avatar_index INTEGER DEFAULT 1,
    pin_code TEXT,
    points_balance INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task templates (reusable task definitions)
CREATE TABLE public.task_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'sparkles',
    category task_category DEFAULT 'other',
    difficulty task_difficulty DEFAULT 'beginner',
    default_points INTEGER DEFAULT 10,
    requires_photo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assigned tasks
CREATE TABLE public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'sparkles',
    category task_category DEFAULT 'other',
    difficulty task_difficulty DEFAULT 'beginner',
    points INTEGER DEFAULT 10,
    status task_status DEFAULT 'pending',
    requires_photo BOOLEAN DEFAULT false,
    photo_url TEXT,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards catalog
CREATE TABLE public.rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'gift',
    image_url TEXT,
    category reward_category DEFAULT 'other',
    points_cost INTEGER NOT NULL,
    quantity_limit INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward redemptions
CREATE TABLE public.redemptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create point transactions
CREATE TABLE public.point_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    description TEXT,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    redemption_id UUID REFERENCES public.redemptions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements/badges
CREATE TABLE public.achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'trophy',
    points_required INTEGER,
    tasks_required INTEGER,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create child achievements junction
CREATE TABLE public.child_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(child_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for families
CREATE POLICY "Users can view families they belong to"
ON public.families FOR SELECT
USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = families.id AND user_id = auth.uid())
);

CREATE POLICY "Users can create families"
ON public.families FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Family owners can update their family"
ON public.families FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Family owners can delete their family"
ON public.families FOR DELETE
USING (auth.uid() = owner_id);

-- RLS Policies for family_members
CREATE POLICY "Members can view family members"
ON public.family_members FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = family_members.family_id AND owner_id = auth.uid()) OR
    user_id = auth.uid()
);

CREATE POLICY "Family owners can add members"
ON public.family_members FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.families WHERE id = family_members.family_id AND owner_id = auth.uid())
);

CREATE POLICY "Family owners can remove members"
ON public.family_members FOR DELETE
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = family_members.family_id AND owner_id = auth.uid())
);

-- RLS Policies for children
CREATE POLICY "Family members can view children"
ON public.children FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = children.family_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = children.family_id AND user_id = auth.uid()) OR
    user_id = auth.uid()
);

CREATE POLICY "Family owners can manage children"
ON public.children FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.families WHERE id = children.family_id AND owner_id = auth.uid())
);

CREATE POLICY "Family owners can update children"
ON public.children FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = children.family_id AND owner_id = auth.uid()) OR
    user_id = auth.uid()
);

CREATE POLICY "Family owners can delete children"
ON public.children FOR DELETE
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = children.family_id AND owner_id = auth.uid())
);

-- RLS Policies for task_templates
CREATE POLICY "Family members can view task templates"
ON public.task_templates FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = task_templates.family_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = task_templates.family_id AND user_id = auth.uid())
);

CREATE POLICY "Family owners can manage task templates"
ON public.task_templates FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = task_templates.family_id AND owner_id = auth.uid())
);

-- RLS Policies for tasks
CREATE POLICY "Family members can view tasks"
ON public.tasks FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = tasks.family_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = tasks.family_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.children WHERE id = tasks.assigned_to AND user_id = auth.uid())
);

CREATE POLICY "Parents can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.families WHERE id = tasks.family_id AND owner_id = auth.uid())
);

CREATE POLICY "Tasks can be updated by parents or assigned children"
ON public.tasks FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = tasks.family_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.children WHERE id = tasks.assigned_to AND user_id = auth.uid())
);

CREATE POLICY "Parents can delete tasks"
ON public.tasks FOR DELETE
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = tasks.family_id AND owner_id = auth.uid())
);

-- RLS Policies for rewards
CREATE POLICY "Family members can view rewards"
ON public.rewards FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = rewards.family_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = rewards.family_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.children WHERE family_id = rewards.family_id AND user_id = auth.uid())
);

CREATE POLICY "Parents can manage rewards"
ON public.rewards FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = rewards.family_id AND owner_id = auth.uid())
);

-- RLS Policies for redemptions
CREATE POLICY "Family members can view redemptions"
ON public.redemptions FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.children c 
        JOIN public.families f ON f.id = c.family_id 
        WHERE c.id = redemptions.child_id AND (f.owner_id = auth.uid() OR c.user_id = auth.uid()))
);

CREATE POLICY "Children can create redemptions"
ON public.redemptions FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.children WHERE id = redemptions.child_id AND user_id = auth.uid())
);

CREATE POLICY "Parents can update redemptions"
ON public.redemptions FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.children c 
        JOIN public.families f ON f.id = c.family_id 
        WHERE c.id = redemptions.child_id AND f.owner_id = auth.uid())
);

-- RLS Policies for point_transactions
CREATE POLICY "Family members can view point transactions"
ON public.point_transactions FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.children c 
        JOIN public.families f ON f.id = c.family_id 
        WHERE c.id = point_transactions.child_id AND (f.owner_id = auth.uid() OR c.user_id = auth.uid()))
);

CREATE POLICY "System can insert point transactions"
ON public.point_transactions FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.children c 
        JOIN public.families f ON f.id = c.family_id 
        WHERE c.id = point_transactions.child_id AND (f.owner_id = auth.uid() OR c.user_id = auth.uid()))
);

-- RLS Policies for achievements
CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

-- RLS Policies for child_achievements
CREATE POLICY "Family members can view child achievements"
ON public.child_achievements FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.children c 
        JOIN public.families f ON f.id = c.family_id 
        WHERE c.id = child_achievements.child_id AND (f.owner_id = auth.uid() OR c.user_id = auth.uid()))
);

CREATE POLICY "System can grant achievements"
ON public.child_achievements FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.children c 
        JOIN public.families f ON f.id = c.family_id 
        WHERE c.id = child_achievements.child_id AND f.owner_id = auth.uid())
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON public.families
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_children_updated_at
    BEFORE UPDATE ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
    BEFORE UPDATE ON public.task_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
    BEFORE UPDATE ON public.rewards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, points_required, tasks_required, category) VALUES
('First Steps', 'Complete your first task!', 'footprints', NULL, 1, 'milestone'),
('High Five', 'Complete 5 tasks', 'hand', NULL, 5, 'milestone'),
('Task Master', 'Complete 25 tasks', 'medal', NULL, 25, 'milestone'),
('Century Club', 'Complete 100 tasks', 'trophy', NULL, 100, 'milestone'),
('Point Collector', 'Earn 100 points', 'coins', 100, NULL, 'points'),
('Saver', 'Earn 500 points', 'piggy-bank', 500, NULL, 'points'),
('Rich Kid', 'Earn 1000 points', 'gem', 1000, NULL, 'points');

-- Create storage bucket for task photos
INSERT INTO storage.buckets (id, name, public) VALUES ('task-photos', 'task-photos', true);

-- Storage policies for task photos
CREATE POLICY "Anyone can view task photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-photos');

CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'task-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-photos' AND auth.uid()::text = (storage.foldername(name))[1]);