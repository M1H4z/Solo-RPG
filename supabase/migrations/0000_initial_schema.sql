-- Create the users table to store profile information
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    country TEXT NULL,
    -- Link to the authenticated user in Supabase Auth
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
);

-- Optional: Add index for faster username lookup
CREATE INDEX idx_users_username ON public.users(username);

-- Enable Row Level Security (RLS) for the users table
-- Initially, allow users to see their own profile
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual user read access" ON public.users
    FOR SELECT USING (auth.uid() = auth_id);
    
CREATE POLICY "Allow individual user update access" ON public.users
    FOR UPDATE USING (auth.uid() = auth_id);

-- Allow users to insert their own profile linked to their auth ID
CREATE POLICY "Allow individual user insert access" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Create the hunters table
CREATE TABLE public.hunters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    rank TEXT NOT NULL DEFAULT 'E',
    experience INTEGER NOT NULL DEFAULT 0,
    strength INTEGER NOT NULL DEFAULT 0,
    agility INTEGER NOT NULL DEFAULT 0,
    perception INTEGER NOT NULL DEFAULT 0,
    intelligence INTEGER NOT NULL DEFAULT 0,
    vitality INTEGER NOT NULL DEFAULT 0,
    skill_points INTEGER NOT NULL DEFAULT 0,
    stat_points INTEGER NOT NULL DEFAULT 0, -- Start with 0 allocated (50 base are inherent), gain on level up
    next_level_experience INTEGER NOT NULL DEFAULT 100, -- Added column for EXP needed for next level
    CONSTRAINT unique_hunter_name_per_user UNIQUE (user_id, name) -- Ensure user can't have two hunters with the same name
);

-- Optional: Add index for faster lookup of hunters by user
CREATE INDEX idx_hunters_user_id ON public.hunters(user_id);

-- Enable Row Level Security (RLS) for the hunters table
-- Allow users to manage their own hunters
ALTER TABLE public.hunters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual user access to their hunters" ON public.hunters
    FOR ALL USING (auth.uid() = user_id);

-- TODO: Add tables for items, skills, inventory, dungeon_state, etc. as needed

-- Function to automatically create a user profile when a new user signs up in Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, username, email)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.email);
  RETURN new;
END;
$$;

-- Trigger the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 