-- Create hashtags table for What'sYourRecipe
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag VARCHAR(100) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON public.hashtags(usage_count);
CREATE INDEX IF NOT EXISTS idx_hashtags_last_used ON public.hashtags(last_used);

-- Enable Row Level Security
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Hashtags are viewable by everyone" ON public.hashtags;
CREATE POLICY "Hashtags are viewable by everyone" 
ON public.hashtags FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "System can manage hashtags" ON public.hashtags;
CREATE POLICY "System can manage hashtags" 
ON public.hashtags FOR ALL 
USING (true);

-- Insert some sample hashtags for testing
INSERT INTO public.hashtags (tag, usage_count, last_used) VALUES
('espresso', 5, NOW()),
('pourover', 3, NOW() - INTERVAL '1 hour'),
('coldBrew', 2, NOW() - INTERVAL '2 hours'),
('frenchPress', 4, NOW() - INTERVAL '30 minutes'),
('aeropress', 3, NOW() - INTERVAL '45 minutes')
ON CONFLICT (tag) DO NOTHING; 