-- Database Schema Update Script for What'sYourRecipe
-- This script safely adds missing columns to existing tables
-- Run this in your Supabase SQL Editor

-- Function to add column if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    table_name text,
    column_name text,
    column_type text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = add_column_if_not_exists.table_name
        AND column_name = add_column_if_not_exists.column_name
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', table_name, column_name, column_type);
        RAISE NOTICE 'Added column %.% (%))', table_name, column_name, column_type;
    ELSE
        RAISE NOTICE 'Column %.% already exists', table_name, column_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- UPDATE PROFILES TABLE
-- ========================================
RAISE NOTICE 'Updating profiles table...';

-- Core profile columns
SELECT add_column_if_not_exists('profiles', 'id', 'UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY');
SELECT add_column_if_not_exists('profiles', 'username', 'VARCHAR(50) UNIQUE NOT NULL');
SELECT add_column_if_not_exists('profiles', 'full_name', 'VARCHAR(100)');
SELECT add_column_if_not_exists('profiles', 'bio', 'TEXT');
SELECT add_column_if_not_exists('profiles', 'avatar_url', 'TEXT');
SELECT add_column_if_not_exists('profiles', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
SELECT add_column_if_not_exists('profiles', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

-- ========================================
-- UPDATE RECIPES TABLE
-- ========================================
RAISE NOTICE 'Updating recipes table...';

-- Basic recipe columns
SELECT add_column_if_not_exists('recipes', 'id', 'UUID DEFAULT gen_random_uuid() PRIMARY KEY');
SELECT add_column_if_not_exists('recipes', 'user_id', 'UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL');
SELECT add_column_if_not_exists('recipes', 'recipe_name', 'VARCHAR(200) NOT NULL');
SELECT add_column_if_not_exists('recipes', 'description', 'TEXT NOT NULL');
SELECT add_column_if_not_exists('recipes', 'rating', 'DECIMAL(3,1) CHECK (rating >= 1 AND rating <= 10)');
SELECT add_column_if_not_exists('recipes', 'date_created', 'DATE');
SELECT add_column_if_not_exists('recipes', 'is_public', 'BOOLEAN DEFAULT true');

-- Bean information columns
SELECT add_column_if_not_exists('recipes', 'bean_variety', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'bean_region', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'india_estate', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'processing_type', 'VARCHAR(100)');

-- Roasting profile columns
SELECT add_column_if_not_exists('recipes', 'roast_type', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'roast_level', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'crack_time', 'VARCHAR(50)');
SELECT add_column_if_not_exists('recipes', 'roast_time', 'DECIMAL(5,2)');
SELECT add_column_if_not_exists('recipes', 'development_time', 'DECIMAL(5,2)');

-- Brewing parameter columns
SELECT add_column_if_not_exists('recipes', 'brew_method', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'grind_microns', 'INTEGER');
SELECT add_column_if_not_exists('recipes', 'water_composition', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'tds', 'DECIMAL(5,2)');
SELECT add_column_if_not_exists('recipes', 'calcium', 'DECIMAL(5,2)');
SELECT add_column_if_not_exists('recipes', 'magnesium', 'DECIMAL(5,2)');
SELECT add_column_if_not_exists('recipes', 'potassium', 'DECIMAL(5,2)');
SELECT add_column_if_not_exists('recipes', 'sodium', 'DECIMAL(5,2)');
SELECT add_column_if_not_exists('recipes', 'coffee_amount', 'DECIMAL(6,2)');
SELECT add_column_if_not_exists('recipes', 'water_amount', 'DECIMAL(8,2)');
SELECT add_column_if_not_exists('recipes', 'water_temp', 'INTEGER');
SELECT add_column_if_not_exists('recipes', 'brew_time', 'DECIMAL(6,2)');

-- Serving preference columns
SELECT add_column_if_not_exists('recipes', 'milk_preference', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'serving_temp', 'VARCHAR(50)');
SELECT add_column_if_not_exists('recipes', 'sweetener', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'sweetener_quantity', 'DECIMAL(5,2)');
SELECT add_column_if_not_exists('recipes', 'serving_size', 'DECIMAL(6,2)');

-- Sensory & evaluation columns
SELECT add_column_if_not_exists('recipes', 'aroma_notes', 'TEXT');
SELECT add_column_if_not_exists('recipes', 'body', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'acidity_type', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'sweetness', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'balance', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'aftertaste', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'clean_cup', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'uniformity', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'cupping_score', 'DECIMAL(5,2) CHECK (cupping_score >= 0 AND cupping_score <= 100)');
SELECT add_column_if_not_exists('recipes', 'cupping_method', 'VARCHAR(100)');
SELECT add_column_if_not_exists('recipes', 'defects', 'TEXT');
SELECT add_column_if_not_exists('recipes', 'overall_impression', 'TEXT');

-- Additional notes columns
SELECT add_column_if_not_exists('recipes', 'brewing_notes', 'TEXT');

-- Timestamp columns
SELECT add_column_if_not_exists('recipes', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
SELECT add_column_if_not_exists('recipes', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

-- ========================================
-- UPDATE RECIPE_VOTES TABLE
-- ========================================
RAISE NOTICE 'Updating recipe_votes table...';

SELECT add_column_if_not_exists('recipe_votes', 'id', 'UUID DEFAULT gen_random_uuid() PRIMARY KEY');
SELECT add_column_if_not_exists('recipe_votes', 'recipe_id', 'UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL');
SELECT add_column_if_not_exists('recipe_votes', 'user_id', 'UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL');
SELECT add_column_if_not_exists('recipe_votes', 'vote_type', 'VARCHAR(10) CHECK (vote_type IN (''up'', ''down'')) NOT NULL');
SELECT add_column_if_not_exists('recipe_votes', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

-- ========================================
-- UPDATE FOLLOWS TABLE
-- ========================================
RAISE NOTICE 'Updating follows table...';

SELECT add_column_if_not_exists('follows', 'id', 'UUID DEFAULT gen_random_uuid() PRIMARY KEY');
SELECT add_column_if_not_exists('follows', 'follower_id', 'UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL');
SELECT add_column_if_not_exists('follows', 'following_id', 'UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL');
SELECT add_column_if_not_exists('follows', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

-- ========================================
-- UPDATE SAVED_RECIPES TABLE
-- ========================================
RAISE NOTICE 'Updating saved_recipes table...';

SELECT add_column_if_not_exists('saved_recipes', 'id', 'UUID DEFAULT gen_random_uuid() PRIMARY KEY');
SELECT add_column_if_not_exists('saved_recipes', 'user_id', 'UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL');
SELECT add_column_if_not_exists('saved_recipes', 'recipe_id', 'UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL');
SELECT add_column_if_not_exists('saved_recipes', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

-- ========================================
-- UPDATE ACTIVITIES TABLE
-- ========================================
RAISE NOTICE 'Updating activities table...';

SELECT add_column_if_not_exists('activities', 'id', 'UUID DEFAULT gen_random_uuid() PRIMARY KEY');
SELECT add_column_if_not_exists('activities', 'user_id', 'UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL');
SELECT add_column_if_not_exists('activities', 'activity_type', 'VARCHAR(50) NOT NULL');
SELECT add_column_if_not_exists('activities', 'content', 'TEXT');
SELECT add_column_if_not_exists('activities', 'recipe_id', 'UUID REFERENCES public.recipes(id) ON DELETE CASCADE');
SELECT add_column_if_not_exists('activities', 'target_user_id', 'UUID REFERENCES auth.users(id) ON DELETE CASCADE');
SELECT add_column_if_not_exists('activities', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

-- ========================================
-- UPDATE HASHTAGS TABLE
-- ========================================
RAISE NOTICE 'Updating hashtags table...';

SELECT add_column_if_not_exists('hashtags', 'id', 'UUID DEFAULT gen_random_uuid() PRIMARY KEY');
SELECT add_column_if_not_exists('hashtags', 'tag', 'VARCHAR(100) UNIQUE NOT NULL');
SELECT add_column_if_not_exists('hashtags', 'usage_count', 'INTEGER DEFAULT 1');
SELECT add_column_if_not_exists('hashtags', 'last_used', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
SELECT add_column_if_not_exists('hashtags', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

-- ========================================
-- CREATE INDEXES (IF NOT EXISTS)
-- ========================================
RAISE NOTICE 'Creating indexes...';

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Recipes indexes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON public.recipes(rating);
CREATE INDEX IF NOT EXISTS idx_recipes_brew_method ON public.recipes(brew_method);
CREATE INDEX IF NOT EXISTS idx_recipes_bean_region ON public.recipes(bean_region);

-- Recipe votes indexes
CREATE INDEX IF NOT EXISTS idx_recipe_votes_recipe_id ON public.recipe_votes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_votes_user_id ON public.recipe_votes(user_id);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Saved recipes indexes
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON public.saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_recipe_id ON public.saved_recipes(recipe_id);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);

-- Hashtags indexes
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON public.hashtags(usage_count);
CREATE INDEX IF NOT EXISTS idx_hashtags_last_used ON public.hashtags(last_used);

-- ========================================
-- CREATE UNIQUE CONSTRAINTS (IF NOT EXISTS)
-- ========================================
RAISE NOTICE 'Creating unique constraints...';

-- Add unique constraints if they don't exist
DO $$
BEGIN
    -- Recipe votes unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'recipe_votes_recipe_id_user_id_key' 
        AND table_name = 'recipe_votes'
    ) THEN
        ALTER TABLE public.recipe_votes ADD CONSTRAINT recipe_votes_recipe_id_user_id_key UNIQUE(recipe_id, user_id);
        RAISE NOTICE 'Added unique constraint to recipe_votes';
    END IF;

    -- Follows unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'follows_follower_id_following_id_key' 
        AND table_name = 'follows'
    ) THEN
        ALTER TABLE public.follows ADD CONSTRAINT follows_follower_id_following_id_key UNIQUE(follower_id, following_id);
        RAISE NOTICE 'Added unique constraint to follows';
    END IF;

    -- Saved recipes unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'saved_recipes_user_id_recipe_id_key' 
        AND table_name = 'saved_recipes'
    ) THEN
        ALTER TABLE public.saved_recipes ADD CONSTRAINT saved_recipes_user_id_recipe_id_key UNIQUE(user_id, recipe_id);
        RAISE NOTICE 'Added unique constraint to saved_recipes';
    END IF;
END $$;

-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================
RAISE NOTICE 'Enabling Row Level Security...';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE/UPDATE RLS POLICIES
-- ========================================
RAISE NOTICE 'Creating RLS policies...';

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Recipes policies
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON public.recipes;
CREATE POLICY "Public recipes are viewable by everyone" ON public.recipes FOR SELECT USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own recipes" ON public.recipes;
CREATE POLICY "Users can manage own recipes" ON public.recipes FOR ALL USING (auth.uid() = user_id);

-- Recipe votes policies
DROP POLICY IF EXISTS "Recipe votes are viewable by everyone" ON public.recipe_votes;
CREATE POLICY "Recipe votes are viewable by everyone" ON public.recipe_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own votes" ON public.recipe_votes;
CREATE POLICY "Users can manage own votes" ON public.recipe_votes FOR ALL USING (auth.uid() = user_id);

-- Follows policies
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own follows" ON public.follows;
CREATE POLICY "Users can manage own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- Saved recipes policies
DROP POLICY IF EXISTS "Users can manage own saved recipes" ON public.saved_recipes;
CREATE POLICY "Users can manage own saved recipes" ON public.saved_recipes FOR ALL USING (auth.uid() = user_id);

-- Activities policies
DROP POLICY IF EXISTS "Activities are viewable by followers" ON public.activities;
CREATE POLICY "Activities are viewable by followers" ON public.activities FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = user_id)
);

DROP POLICY IF EXISTS "Users can create own activities" ON public.activities;
CREATE POLICY "Users can create own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Hashtags policies
DROP POLICY IF EXISTS "Hashtags are viewable by everyone" ON public.hashtags;
CREATE POLICY "Hashtags are viewable by everyone" ON public.hashtags FOR SELECT USING (true);

-- Clean up the helper function
DROP FUNCTION IF EXISTS add_column_if_not_exists(text, text, text);

-- ========================================
-- FINAL STATUS CHECK
-- ========================================
RAISE NOTICE '========================================';
RAISE NOTICE 'Database schema update completed!';
RAISE NOTICE '========================================';

-- Show table information
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename; 