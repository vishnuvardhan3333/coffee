-- Database Setup for What'sYourRecipe Social Platform
-- Run this SQL in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipe_name TEXT NOT NULL,
    description TEXT NOT NULL,
    rating DECIMAL(3,1) CHECK (rating >= 1 AND rating <= 10),
    date_created DATE NOT NULL,
    
    -- Bean Information
    bean_variety TEXT,
    bean_region TEXT,
    india_estate TEXT,
    processing_type TEXT,
    
    -- Roasting Profile
    roast_type TEXT,
    roast_level TEXT,
    crack_time TEXT,
    roast_time DECIMAL(4,1),
    development_time DECIMAL(4,1),
    
    -- Brewing Parameters
    brew_method TEXT,
    grind_microns INTEGER,
    water_composition TEXT,
    tds INTEGER,
    calcium DECIMAL(5,2),
    magnesium DECIMAL(5,2),
    potassium DECIMAL(5,2),
    sodium DECIMAL(5,2),
    coffee_amount DECIMAL(5,1),
    water_amount DECIMAL(6,1),
    water_temp INTEGER,
    brew_time DECIMAL(4,2),
    
    -- Serving Preferences
    milk_preference TEXT,
    serving_temp TEXT,
    sweetener TEXT,
    sweetener_quantity DECIMAL(4,1),
    serving_size INTEGER,
    
    -- Sensory Evaluation
    aroma_notes TEXT,
    body TEXT,
    acidity_type TEXT,
    sweetness TEXT,
    balance TEXT,
    aftertaste TEXT,
    clean_cup TEXT,
    uniformity TEXT,
    cupping_score DECIMAL(5,2) CHECK (cupping_score >= 60 AND cupping_score <= 100),
    cupping_method TEXT,
    defects TEXT,
    overall_impression TEXT,
    
    -- Additional Notes
    brewing_notes TEXT,
    
    -- Social Features
    is_public BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe votes table
CREATE TABLE IF NOT EXISTS public.recipe_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(recipe_id, user_id)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create saved recipes table
CREATE TABLE IF NOT EXISTS public.saved_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, recipe_id)
);

-- Create recipe comments table
CREATE TABLE IF NOT EXISTS public.recipe_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity feed table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'like', 'follow', 'comment', 'create_recipe'
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_public ON public.recipes(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_votes_recipe_id ON public.recipe_votes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_votes_user_id ON public.recipe_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user ON public.saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(user_id, created_at DESC);

-- Row Level Security Policies

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public recipes are viewable by everyone" ON public.recipes
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes" ON public.recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON public.recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON public.recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe Votes
ALTER TABLE public.recipe_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recipe votes" ON public.recipe_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote on recipes" ON public.recipe_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.recipe_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.recipe_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Saved Recipes
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved recipes" ON public.saved_recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save recipes" ON public.saved_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave recipes" ON public.saved_recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe Comments
ALTER TABLE public.recipe_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments on public recipes" ON public.recipe_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recipes 
            WHERE recipes.id = recipe_comments.recipe_id 
            AND (recipes.is_public = true OR recipes.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can add comments" ON public.recipe_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.recipe_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.recipe_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their feed" ON public.activities
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = target_user_id OR
        EXISTS (
            SELECT 1 FROM public.follows 
            WHERE follows.follower_id = auth.uid() 
            AND follows.following_id = activities.user_id
        )
    );

CREATE POLICY "System can insert activities" ON public.activities
    FOR INSERT WITH CHECK (true);

-- Functions

-- Function to handle new user signup (only for confirmed users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Only create profile if email is confirmed
    IF NEW.email_confirmed_at IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, username, full_name)
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
            COALESCE(new.raw_user_meta_data->>'full_name', '')
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for email confirmation (handles users who confirm later)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_recipes
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_comments
    BEFORE UPDATE ON public.recipe_comments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to create activity for recipe creation
CREATE OR REPLACE FUNCTION public.handle_recipe_creation()
RETURNS trigger AS $$
BEGIN
    IF NEW.is_public = true THEN
        INSERT INTO public.activities (user_id, recipe_id, activity_type, content)
        VALUES (NEW.user_id, NEW.id, 'create_recipe', NEW.recipe_name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for recipe creation activity
CREATE TRIGGER on_recipe_created
    AFTER INSERT ON public.recipes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_recipe_creation();

-- Function to create activity for votes
CREATE OR REPLACE FUNCTION public.handle_vote_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.activities (user_id, target_user_id, recipe_id, activity_type)
    SELECT 
        NEW.user_id, 
        recipes.user_id, 
        NEW.recipe_id, 
        CASE WHEN NEW.vote_type = 'up' THEN 'like' ELSE 'dislike' END
    FROM public.recipes 
    WHERE recipes.id = NEW.recipe_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vote activity
CREATE TRIGGER on_vote_created
    AFTER INSERT ON public.recipe_votes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_vote_activity();

-- Function to create activity for follows
CREATE OR REPLACE FUNCTION public.handle_follow_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.activities (user_id, target_user_id, activity_type)
    VALUES (NEW.follower_id, NEW.following_id, 'follow');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follow activity
CREATE TRIGGER on_follow_created
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE PROCEDURE public.handle_follow_activity();

-- Function to increment recipe view count
CREATE OR REPLACE FUNCTION public.increment_recipe_views(recipe_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.recipes 
    SET view_count = view_count + 1
    WHERE id = recipe_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Views for easier querying

-- Recipe feed view with vote counts
CREATE OR REPLACE VIEW public.recipe_feed AS
SELECT 
    r.*,
    p.username,
    p.full_name,
    p.avatar_url,
    COALESCE(upvotes.count, 0) as upvote_count,
    COALESCE(downvotes.count, 0) as downvote_count,
    COALESCE(comments.count, 0) as comment_count
FROM public.recipes r
LEFT JOIN public.profiles p ON r.user_id = p.id
LEFT JOIN (
    SELECT recipe_id, COUNT(*) as count
    FROM public.recipe_votes
    WHERE vote_type = 'up'
    GROUP BY recipe_id
) upvotes ON r.id = upvotes.recipe_id
LEFT JOIN (
    SELECT recipe_id, COUNT(*) as count
    FROM public.recipe_votes
    WHERE vote_type = 'down'
    GROUP BY recipe_id
) downvotes ON r.id = downvotes.recipe_id
LEFT JOIN (
    SELECT recipe_id, COUNT(*) as count
    FROM public.recipe_comments
    GROUP BY recipe_id
) comments ON r.id = comments.recipe_id;

-- User stats view
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    p.id,
    p.username,
    p.full_name,
    COALESCE(recipes.count, 0) as recipe_count,
    COALESCE(followers.count, 0) as follower_count,
    COALESCE(following.count, 0) as following_count
FROM public.profiles p
LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM public.recipes
    WHERE is_public = true
    GROUP BY user_id
) recipes ON p.id = recipes.user_id
LEFT JOIN (
    SELECT following_id, COUNT(*) as count
    FROM public.follows
    GROUP BY following_id
) followers ON p.id = followers.following_id
LEFT JOIN (
    SELECT follower_id, COUNT(*) as count
    FROM public.follows
    GROUP BY follower_id
) following ON p.id = following.follower_id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, service_role;

-- Create RPC functions that the app calls for initialization
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
    -- This function exists so the app doesn't error when calling it
    -- The actual table creation is handled by the schema above
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_recipes_table()
RETURNS void AS $$
BEGIN
    -- This function exists so the app doesn't error when calling it
    -- The actual table creation is handled by the schema above
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_votes_table()
RETURNS void AS $$
BEGIN
    -- This function exists so the app doesn't error when calling it
    -- The actual table creation is handled by the schema above
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_follows_table()
RETURNS void AS $$
BEGIN
    -- This function exists so the app doesn't error when calling it
    -- The actual table creation is handled by the schema above
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Sample data removed to avoid foreign key constraint violations
-- Real user profiles and recipes will be created when users sign up and create content 