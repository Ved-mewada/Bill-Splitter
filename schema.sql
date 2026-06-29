-- Supabase Schema for ExpenseHub

-- 0. Clean up existing tables (for safe re-runs)
DROP TABLE IF EXISTS public.group_expense_payments CASCADE;
DROP TABLE IF EXISTS public.group_members_local CASCADE;
DROP TABLE IF EXISTS public.group_expenses CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.shared_groups CASCADE;
DROP TABLE IF EXISTS public.personal_expenses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.get_joined_group_ids CASCADE;
DROP FUNCTION IF EXISTS public.get_owned_group_ids CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

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
    category TEXT NOT NULL DEFAULT 'Other' CHECK (category IN ('Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other')),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
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

-- Local members (friends without auth accounts)
CREATE TABLE public.group_members_local (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments made by any member (auth or local) for settlement tracking
CREATE TABLE public.group_expense_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
    payer_type TEXT NOT NULL CHECK (payer_type IN ('auth', 'local')),
    payer_id UUID NOT NULL,
    payer_name TEXT NOT NULL,
    amount DECIMAL(10,2) CHECK (amount > 0),
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other' CHECK (category IN ('Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members_local ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expense_payments ENABLE ROW LEVEL SECURITY;

-- 3. Functions
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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security definer functions to safely fetch group IDs without triggering RLS infinite recursion
CREATE OR REPLACE FUNCTION public.get_joined_group_ids()
RETURNS SETOF uuid AS $$
BEGIN
    RETURN QUERY SELECT group_id FROM public.group_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_owned_group_ids()
RETURNS SETOF uuid AS $$
BEGIN
    RETURN QUERY SELECT id FROM public.shared_groups WHERE created_by = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. RLS Policies

-- users
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Backfill existing auth users into public.users (run separately if needed)
-- INSERT INTO public.users (id, email, name)
-- SELECT id, email, raw_user_meta_data->>'name'
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;

-- personal_expenses
CREATE POLICY "Users can select own expenses" ON public.personal_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.personal_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.personal_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.personal_expenses FOR DELETE USING (auth.uid() = user_id);

-- shared_groups
CREATE POLICY "Users can insert groups" ON public.shared_groups 
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can select groups" ON public.shared_groups 
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Members can select groups" ON public.shared_groups 
    FOR SELECT USING (id IN (SELECT public.get_joined_group_ids()));

CREATE POLICY "Creators can update groups" ON public.shared_groups 
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete groups" ON public.shared_groups 
    FOR DELETE USING (auth.uid() = created_by);

-- group_members
CREATE POLICY "Users can insert own memberships" ON public.group_members 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own memberships" ON public.group_members 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can select memberships of their groups" ON public.group_members 
    FOR SELECT USING (group_id IN (SELECT public.get_owned_group_ids()));

CREATE POLICY "Members can select other members in their groups" ON public.group_members 
    FOR SELECT USING (group_id IN (SELECT public.get_joined_group_ids()));

CREATE POLICY "Users can delete own memberships" ON public.group_members 
    FOR DELETE USING (auth.uid() = user_id);

-- group_expenses
CREATE POLICY "Users can insert group expenses" ON public.group_expenses 
    FOR INSERT WITH CHECK (
        auth.uid() = paid_by AND
        (group_id IN (SELECT public.get_joined_group_ids()) OR group_id IN (SELECT public.get_owned_group_ids()))
    );

CREATE POLICY "Users can select group expenses" ON public.group_expenses 
    FOR SELECT USING (
        group_id IN (SELECT public.get_joined_group_ids()) OR group_id IN (SELECT public.get_owned_group_ids())
    );

CREATE POLICY "Users can update own group expenses" ON public.group_expenses 
    FOR UPDATE USING (auth.uid() = paid_by);

CREATE POLICY "Users can delete own group expenses" ON public.group_expenses 
    FOR DELETE USING (auth.uid() = paid_by);

-- group_members_local
CREATE POLICY "Members can view local members" ON public.group_members_local
    FOR SELECT USING (
        group_id IN (SELECT public.get_joined_group_ids()) OR group_id IN (SELECT public.get_owned_group_ids())
    );
CREATE POLICY "Members can insert local members" ON public.group_members_local
    FOR INSERT WITH CHECK (
        group_id IN (SELECT public.get_owned_group_ids())
    );
CREATE POLICY "Members can delete local members" ON public.group_members_local
    FOR DELETE USING (
        group_id IN (SELECT public.get_owned_group_ids())
    );

-- group_expense_payments
CREATE POLICY "Members can view payments" ON public.group_expense_payments
    FOR SELECT USING (
        group_id IN (SELECT public.get_joined_group_ids()) OR group_id IN (SELECT public.get_owned_group_ids())
    );
CREATE POLICY "Members can insert payments" ON public.group_expense_payments
    FOR INSERT WITH CHECK (
        group_id IN (SELECT public.get_joined_group_ids()) OR group_id IN (SELECT public.get_owned_group_ids())
    );
CREATE POLICY "Members can delete payments" ON public.group_expense_payments
    FOR DELETE USING (
        group_id IN (SELECT public.get_owned_group_ids())
    );
