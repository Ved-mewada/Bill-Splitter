-- Supabase Schema for WanderLedger Travel Journal

-- 1. Create Tables

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.personal_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) CHECK (amount > 0),
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.shared_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE public.group_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) CHECK (amount > 0),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- users
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Trigger to create a user profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- personal_expenses
CREATE POLICY "Users can manage their own expenses" ON public.personal_expenses
    FOR ALL USING (auth.uid() = user_id);

-- shared_groups
CREATE POLICY "Users can view groups they are in" ON public.shared_groups
    FOR SELECT USING (
        auth.uid() = created_by OR 
        id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create groups" ON public.shared_groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can delete groups" ON public.shared_groups
    FOR DELETE USING (auth.uid() = created_by);

-- group_members
CREATE POLICY "Users can view members of their groups" ON public.group_members
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()) OR
        group_id IN (SELECT id FROM public.shared_groups WHERE created_by = auth.uid())
    );

CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
    FOR DELETE USING (auth.uid() = user_id);

-- group_expenses
CREATE POLICY "Users can view expenses in their groups" ON public.group_expenses
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can add expenses to their groups" ON public.group_expenses
    FOR INSERT WITH CHECK (
        auth.uid() = paid_by AND
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    );
