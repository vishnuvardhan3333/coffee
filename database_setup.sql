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

-- Create hashtags table for trending tags
CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe_hashtags junction table
CREATE TABLE IF NOT EXISTS public.recipe_hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(recipe_id, hashtag_id)
);

-- Create recipe views table for analytics
CREATE TABLE IF NOT EXISTS public.recipe_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Allow one view per user per recipe per day
    UNIQUE(recipe_id, user_id, DATE(created_at))
);

-- Create user recommendations cache table
CREATE TABLE IF NOT EXISTS public.user_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recommended_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    score DECIMAL(3,2) DEFAULT 0.0,
    reason TEXT, -- 'similar_taste', 'popular', 'mutual_follows'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    UNIQUE(user_id, recommended_user_id)
);

-- Create trending cache table
CREATE TABLE IF NOT EXISTS public.trending_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    timeframe TEXT CHECK (timeframe IN ('1day', '7day', '30day')) NOT NULL,
    score DECIMAL(10,2) DEFAULT 0.0, -- calculated trending score
    votes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    
    UNIQUE(recipe_id, timeframe)
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

-- New indexes for advanced features
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON public.hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_last_used ON public.hashtags(last_used DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_hashtags_recipe ON public.recipe_hashtags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_hashtags_hashtag ON public.recipe_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_recipe ON public.recipe_views(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_user ON public.recipe_views(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_created_at ON public.recipe_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user ON public.user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_expires ON public.user_recommendations(expires_at);
CREATE INDEX IF NOT EXISTS idx_trending_recipes_timeframe ON public.trending_recipes(timeframe, score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_recipes_expires ON public.trending_recipes(expires_at);
CREATE INDEX IF NOT EXISTS idx_activities_target_user ON public.activities(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_recipe ON public.activities(recipe_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type, created_at DESC);

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

-- Hashtags
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hashtags" ON public.hashtags
    FOR SELECT USING (true);

CREATE POLICY "System can manage hashtags" ON public.hashtags
    FOR ALL USING (true);

-- Recipe Hashtags
ALTER TABLE public.recipe_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recipe hashtags" ON public.recipe_hashtags
    FOR SELECT USING (true);

CREATE POLICY "Recipe owners can manage hashtags" ON public.recipe_hashtags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipes 
            WHERE recipes.id = recipe_hashtags.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Recipe Views
ALTER TABLE public.recipe_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recipe views" ON public.recipe_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track recipe views" ON public.recipe_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recipe owners can see their recipe views" ON public.recipe_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recipes 
            WHERE recipes.id = recipe_views.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- User Recommendations
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations" ON public.user_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage recommendations" ON public.user_recommendations
    FOR ALL USING (true);

-- Trending Recipes
ALTER TABLE public.trending_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trending recipes" ON public.trending_recipes
    FOR SELECT USING (true);

CREATE POLICY "System can manage trending" ON public.trending_recipes
    FOR ALL USING (true);

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

-- Trigger for hashtag extraction on recipe creation/update
CREATE TRIGGER extract_hashtags_on_recipe_change
    AFTER INSERT OR UPDATE ON public.recipes
    FOR EACH ROW EXECUTE PROCEDURE public.extract_hashtags_from_recipe();

-- Enhanced function to track recipe views
CREATE OR REPLACE FUNCTION public.track_recipe_view(
    recipe_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_str TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Insert view record (will be ignored if duplicate user+recipe+date)
    INSERT INTO public.recipe_views (recipe_id, user_id, ip_address, user_agent)
    VALUES (recipe_uuid, user_uuid, ip_addr, user_agent_str)
    ON CONFLICT (recipe_id, user_id, DATE(created_at)) DO NOTHING;
    
    -- Update recipe view count
    UPDATE public.recipes 
    SET view_count = view_count + 1
    WHERE id = recipe_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract and update hashtags from recipe content
CREATE OR REPLACE FUNCTION public.extract_hashtags_from_recipe()
RETURNS trigger AS $$
DECLARE
    hashtag_text TEXT;
    hashtag_record RECORD;
    hashtag_id UUID;
BEGIN
    -- Clear existing hashtags for this recipe
    DELETE FROM public.recipe_hashtags WHERE recipe_id = NEW.id;
    
    -- Extract hashtags from description and brewing notes
    FOR hashtag_text IN 
        SELECT DISTINCT lower(trim(regexp_replace(match, '#', ''))) as tag
        FROM (
            SELECT regexp_split_to_table(NEW.description || ' ' || COALESCE(NEW.brewing_notes, ''), '\s+') as match
            WHERE NEW.description IS NOT NULL
        ) matches
        WHERE match ~ '^#[a-zA-Z0-9_]+$'
        AND length(trim(regexp_replace(match, '#', ''))) >= 2
    LOOP
        -- Insert or update hashtag
        INSERT INTO public.hashtags (tag, usage_count, last_used)
        VALUES (hashtag_text, 1, NOW())
        ON CONFLICT (tag) 
        DO UPDATE SET 
            usage_count = hashtags.usage_count + 1,
            last_used = NOW()
        RETURNING id INTO hashtag_id;
        
        -- Link recipe to hashtag
        INSERT INTO public.recipe_hashtags (recipe_id, hashtag_id)
        VALUES (NEW.id, hashtag_id);
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending hashtags
CREATE OR REPLACE FUNCTION public.get_trending_hashtags(
    limit_count INTEGER DEFAULT 10,
    days_back INTEGER DEFAULT 1
)
RETURNS TABLE (
    tag TEXT,
    usage_count INTEGER,
    recent_usage_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.tag,
        h.usage_count,
        COUNT(rh.id) as recent_usage_count
    FROM public.hashtags h
    LEFT JOIN public.recipe_hashtags rh ON h.id = rh.hashtag_id
    LEFT JOIN public.recipes r ON rh.recipe_id = r.id
    WHERE r.created_at >= NOW() - (days_back || ' days')::INTERVAL
    OR h.last_used >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY h.id, h.tag, h.usage_count
    ORDER BY recent_usage_count DESC, h.usage_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recipes by hashtag
CREATE OR REPLACE FUNCTION public.get_recipes_by_hashtag(
    hashtag_name TEXT,
    sort_by TEXT DEFAULT 'recent', -- 'recent', 'popular', 'trending', 'rating'
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    recipe_id UUID,
    recipe_name TEXT,
    description TEXT,
    rating DECIMAL,
    view_count INTEGER,
    vote_score BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as recipe_id,
        r.recipe_name,
        r.description,
        r.rating,
        r.view_count,
        COALESCE(votes_up.count, 0) - COALESCE(votes_down.count, 0) as vote_score,
        r.created_at
    FROM public.recipes r
    INNER JOIN public.recipe_hashtags rh ON r.id = rh.recipe_id
    INNER JOIN public.hashtags h ON rh.hashtag_id = h.id
    LEFT JOIN (
        SELECT recipe_id, COUNT(*) as count
        FROM public.recipe_votes
        WHERE vote_type = 'up'
        GROUP BY recipe_id
    ) votes_up ON r.id = votes_up.recipe_id
    LEFT JOIN (
        SELECT recipe_id, COUNT(*) as count
        FROM public.recipe_votes
        WHERE vote_type = 'down'
        GROUP BY recipe_id
    ) votes_down ON r.id = votes_down.recipe_id
    WHERE h.tag = lower(hashtag_name)
    AND r.is_public = true
    ORDER BY 
        CASE 
            WHEN sort_by = 'popular' THEN r.view_count
            WHEN sort_by = 'trending' THEN (COALESCE(votes_up.count, 0) - COALESCE(votes_down.count, 0))
            WHEN sort_by = 'rating' THEN r.rating::INTEGER
            ELSE EXTRACT(EPOCH FROM r.created_at)::INTEGER
        END DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION public.calculate_trending_score(
    votes_up INTEGER,
    votes_down INTEGER,
    views_count INTEGER,
    comments_count INTEGER,
    hours_old NUMERIC
)
RETURNS DECIMAL AS $$
DECLARE
    score DECIMAL;
    vote_score INTEGER;
BEGIN
    -- Calculate vote score (upvotes - downvotes)
    vote_score := COALESCE(votes_up, 0) - COALESCE(votes_down, 0);
    
    -- Base score from votes (weighted more heavily)
    score := vote_score * 10;
    
    -- Add view score (less weight)
    score := score + (COALESCE(views_count, 0) * 0.1);
    
    -- Add comment score (medium weight)
    score := score + (COALESCE(comments_count, 0) * 2);
    
    -- Apply time decay (newer content gets boost)
    IF hours_old <= 24 THEN
        score := score * 1.5; -- 50% boost for content under 24 hours
    ELSIF hours_old <= 168 THEN -- 7 days
        score := score * (1.0 - (hours_old - 24) / 168 * 0.3); -- Gradual decay
    ELSE
        score := score * 0.7; -- 30% penalty for old content
    END IF;
    
    RETURN GREATEST(score, 0); -- Ensure non-negative
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update trending recipes cache
CREATE OR REPLACE FUNCTION public.update_trending_recipes()
RETURNS void AS $$
DECLARE
    recipe_record RECORD;
    trending_score DECIMAL;
    timeframes TEXT[] := ARRAY['1day', '7day', '30day'];
    tf TEXT;
    cutoff_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Clear expired entries
    DELETE FROM public.trending_recipes WHERE expires_at < NOW();
    
    -- Update trending for each timeframe
    FOREACH tf IN ARRAY timeframes
    LOOP
        -- Set cutoff time based on timeframe
        CASE tf
            WHEN '1day' THEN cutoff_time := NOW() - INTERVAL '1 day';
            WHEN '7day' THEN cutoff_time := NOW() - INTERVAL '7 days';
            WHEN '30day' THEN cutoff_time := NOW() - INTERVAL '30 days';
        END CASE;
        
        -- Process each public recipe
        FOR recipe_record IN
            SELECT 
                r.id,
                r.created_at,
                r.view_count,
                COALESCE(votes_up.count, 0) as votes_up,
                COALESCE(votes_down.count, 0) as votes_down,
                COALESCE(comments.count, 0) as comments_count,
                EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 3600 as hours_old
            FROM public.recipes r
            LEFT JOIN (
                SELECT recipe_id, COUNT(*) as count
                FROM public.recipe_votes
                WHERE vote_type = 'up' AND created_at >= cutoff_time
                GROUP BY recipe_id
            ) votes_up ON r.id = votes_up.recipe_id
            LEFT JOIN (
                SELECT recipe_id, COUNT(*) as count
                FROM public.recipe_votes
                WHERE vote_type = 'down' AND created_at >= cutoff_time
                GROUP BY recipe_id
            ) votes_down ON r.id = votes_down.recipe_id
            LEFT JOIN (
                SELECT recipe_id, COUNT(*) as count
                FROM public.recipe_comments
                WHERE created_at >= cutoff_time
                GROUP BY recipe_id
            ) comments ON r.id = comments.recipe_id
            WHERE r.is_public = true
            AND r.created_at >= cutoff_time
        LOOP
            -- Calculate trending score
            trending_score := public.calculate_trending_score(
                recipe_record.votes_up,
                recipe_record.votes_down,
                recipe_record.view_count,
                recipe_record.comments_count,
                recipe_record.hours_old
            );
            
            -- Insert or update trending cache
            INSERT INTO public.trending_recipes (
                recipe_id, timeframe, score, votes_count, views_count, comments_count
            )
            VALUES (
                recipe_record.id, tf, trending_score, 
                recipe_record.votes_up, recipe_record.view_count, recipe_record.comments_count
            )
            ON CONFLICT (recipe_id, timeframe)
            DO UPDATE SET
                score = trending_score,
                votes_count = recipe_record.votes_up,
                views_count = recipe_record.view_count,
                comments_count = recipe_record.comments_count,
                expires_at = NOW() + INTERVAL '1 hour';
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired recommendations
    DELETE FROM public.user_recommendations WHERE expires_at < NOW();
    
    -- Clean up old activities (keep only last 30 days)
    DELETE FROM public.activities WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old recipe views (keep only last 90 days for analytics)
    DELETE FROM public.recipe_views WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up unused hashtags (no recipes linked and not used in 30 days)
    DELETE FROM public.hashtags 
    WHERE last_used < NOW() - INTERVAL '30 days'
    AND id NOT IN (SELECT DISTINCT hashtag_id FROM public.recipe_hashtags);
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

-- Create a view for easy trending recipes access
CREATE OR REPLACE VIEW public.trending_recipes_view AS
SELECT 
    tr.recipe_id,
    tr.timeframe,
    tr.score as trending_score,
    tr.votes_count,
    tr.views_count,
    r.recipe_name,
    r.description,
    r.rating,
    r.created_at,
    p.username,
    p.full_name,
    p.avatar_url
FROM public.trending_recipes tr
JOIN public.recipes r ON tr.recipe_id = r.id
JOIN public.profiles p ON r.user_id = p.id
WHERE tr.expires_at > NOW()
AND r.is_public = true;

-- Grant permissions for the new functions and views
GRANT EXECUTE ON FUNCTION public.track_recipe_view TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_trending_hashtags TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_recipes_by_hashtag TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_trending_recipes TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_data TO service_role;
GRANT SELECT ON public.trending_recipes_view TO authenticated, anon, service_role; 