#!/usr/bin/env python3
"""
Database Manager for What'sYourRecipe
Manages Supabase database structure and migrations
"""

import os
import sys
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for admin operations
        
        if not self.supabase_url or not self.supabase_key:
            print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables")
            sys.exit(1)
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        print(f"✅ Connected to Supabase: {self.supabase_url}")

    def execute_sql(self, sql_query, description=""):
        """Execute SQL query with error handling"""
        try:
            print(f"🔄 {description or 'Executing SQL'}...")
            result = self.supabase.rpc('execute_sql', {'query': sql_query}).execute()
            print(f"✅ Success: {description}")
            return result
        except Exception as e:
            print(f"❌ Error {description}: {str(e)}")
            return None

    def create_profiles_table(self):
        """Create or update profiles table"""
        sql = """
        -- Create profiles table if not exists
        CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            full_name VARCHAR(100),
            bio TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
        CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

        -- Enable Row Level Security
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
        CREATE POLICY "Public profiles are viewable by everyone" 
        ON public.profiles FOR SELECT 
        USING (true);

        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
        CREATE POLICY "Users can insert own profile" 
        ON public.profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
        """
        
        return self.execute_sql(sql, "Creating/updating profiles table")

    def create_recipes_table(self):
        """Create or update recipes table"""
        sql = """
        -- Create recipes table if not exists
        CREATE TABLE IF NOT EXISTS public.recipes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            recipe_name VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            rating DECIMAL(3,1) CHECK (rating >= 1 AND rating <= 10),
            date_created DATE,
            is_public BOOLEAN DEFAULT true,
            
            -- Bean information
            bean_variety VARCHAR(100),
            bean_region VARCHAR(100),
            india_estate VARCHAR(100),
            processing_type VARCHAR(100),
            
            -- Roasting profile
            roast_type VARCHAR(100),
            roast_level VARCHAR(100),
            crack_time VARCHAR(50),
            roast_time DECIMAL(5,2),
            development_time DECIMAL(5,2),
            
            -- Brewing parameters
            brew_method VARCHAR(100),
            grind_microns INTEGER,
            water_composition VARCHAR(100),
            tds DECIMAL(5,2),
            calcium DECIMAL(5,2),
            magnesium DECIMAL(5,2),
            potassium DECIMAL(5,2),
            sodium DECIMAL(5,2),
            coffee_amount DECIMAL(6,2),
            water_amount DECIMAL(8,2),
            water_temp INTEGER,
            brew_time DECIMAL(6,2),
            
            -- Serving preferences
            milk_preference VARCHAR(100),
            serving_temp VARCHAR(50),
            sweetener VARCHAR(100),
            sweetener_quantity DECIMAL(5,2),
            serving_size DECIMAL(6,2),
            
            -- Sensory & evaluation
            aroma_notes TEXT,
            body VARCHAR(100),
            acidity_type VARCHAR(100),
            sweetness VARCHAR(100),
            balance VARCHAR(100),
            aftertaste VARCHAR(100),
            clean_cup VARCHAR(100),
            uniformity VARCHAR(100),
            cupping_score DECIMAL(5,2) CHECK (cupping_score >= 0 AND cupping_score <= 100),
            cupping_method VARCHAR(100),
            defects TEXT,
            overall_impression TEXT,
            
            -- Additional notes
            brewing_notes TEXT,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
        CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at);
        CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public);
        CREATE INDEX IF NOT EXISTS idx_recipes_rating ON public.recipes(rating);

        -- Enable Row Level Security
        ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON public.recipes;
        CREATE POLICY "Public recipes are viewable by everyone" 
        ON public.recipes FOR SELECT 
        USING (is_public = true OR auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can manage own recipes" ON public.recipes;
        CREATE POLICY "Users can manage own recipes" 
        ON public.recipes FOR ALL 
        USING (auth.uid() = user_id);
        """
        
        return self.execute_sql(sql, "Creating/updating recipes table")

    def create_recipe_votes_table(self):
        """Create recipe votes table"""
        sql = """
        -- Create recipe votes table
        CREATE TABLE IF NOT EXISTS public.recipe_votes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(recipe_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_recipe_votes_recipe_id ON public.recipe_votes(recipe_id);
        CREATE INDEX IF NOT EXISTS idx_recipe_votes_user_id ON public.recipe_votes(user_id);

        -- Enable RLS
        ALTER TABLE public.recipe_votes ENABLE ROW LEVEL SECURITY;

        -- Policies
        DROP POLICY IF EXISTS "Recipe votes are viewable by everyone" ON public.recipe_votes;
        CREATE POLICY "Recipe votes are viewable by everyone" 
        ON public.recipe_votes FOR SELECT 
        USING (true);

        DROP POLICY IF EXISTS "Users can manage own votes" ON public.recipe_votes;
        CREATE POLICY "Users can manage own votes" 
        ON public.recipe_votes FOR ALL 
        USING (auth.uid() = user_id);
        """
        
        return self.execute_sql(sql, "Creating recipe votes table")

    def create_follows_table(self):
        """Create follows table"""
        sql = """
        -- Create follows table
        CREATE TABLE IF NOT EXISTS public.follows (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(follower_id, following_id),
            CHECK (follower_id != following_id)
        );

        CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
        CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

        -- Enable RLS
        ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

        -- Policies
        DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
        CREATE POLICY "Follows are viewable by everyone" 
        ON public.follows FOR SELECT 
        USING (true);

        DROP POLICY IF EXISTS "Users can manage own follows" ON public.follows;
        CREATE POLICY "Users can manage own follows" 
        ON public.follows FOR ALL 
        USING (auth.uid() = follower_id);
        """
        
        return self.execute_sql(sql, "Creating follows table")

    def create_saved_recipes_table(self):
        """Create saved recipes table"""
        sql = """
        -- Create saved recipes table
        CREATE TABLE IF NOT EXISTS public.saved_recipes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, recipe_id)
        );

        CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON public.saved_recipes(user_id);
        CREATE INDEX IF NOT EXISTS idx_saved_recipes_recipe_id ON public.saved_recipes(recipe_id);

        -- Enable RLS
        ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

        -- Policies
        DROP POLICY IF EXISTS "Users can manage own saved recipes" ON public.saved_recipes;
        CREATE POLICY "Users can manage own saved recipes" 
        ON public.saved_recipes FOR ALL 
        USING (auth.uid() = user_id);
        """
        
        return self.execute_sql(sql, "Creating saved recipes table")

    def create_activities_table(self):
        """Create activities table for activity feed"""
        sql = """
        -- Create activities table
        CREATE TABLE IF NOT EXISTS public.activities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            activity_type VARCHAR(50) NOT NULL,
            content TEXT,
            recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
            target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
        CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
        CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);

        -- Enable RLS
        ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

        -- Policies
        DROP POLICY IF EXISTS "Activities are viewable by followers" ON public.activities;
        CREATE POLICY "Activities are viewable by followers" 
        ON public.activities FOR SELECT 
        USING (
            auth.uid() = user_id OR 
            EXISTS (
                SELECT 1 FROM public.follows 
                WHERE follower_id = auth.uid() AND following_id = user_id
            )
        );

        DROP POLICY IF EXISTS "Users can create own activities" ON public.activities;
        CREATE POLICY "Users can create own activities" 
        ON public.activities FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        """
        
        return self.execute_sql(sql, "Creating activities table")

    def create_hashtags_table(self):
        """Create hashtags table"""
        sql = """
        -- Create hashtags table
        CREATE TABLE IF NOT EXISTS public.hashtags (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tag VARCHAR(100) UNIQUE NOT NULL,
            usage_count INTEGER DEFAULT 1,
            last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.hashtags(tag);
        CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON public.hashtags(usage_count);
        CREATE INDEX IF NOT EXISTS idx_hashtags_last_used ON public.hashtags(last_used);

        -- Enable RLS
        ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

        -- Policies
        DROP POLICY IF EXISTS "Hashtags are viewable by everyone" ON public.hashtags;
        CREATE POLICY "Hashtags are viewable by everyone" 
        ON public.hashtags FOR SELECT 
        USING (true);
        """
        
        return self.execute_sql(sql, "Creating hashtags table")

    def create_storage_bucket(self):
        """Create storage bucket for avatars"""
        try:
            # Check if bucket exists
            buckets = self.supabase.storage.list_buckets()
            avatar_bucket_exists = any(bucket.name == 'avatars' for bucket in buckets)
            
            if not avatar_bucket_exists:
                # Create bucket
                self.supabase.storage.create_bucket('avatars', {'public': True})
                print("✅ Created avatars storage bucket")
            else:
                print("✅ Avatars storage bucket already exists")
                
            return True
        except Exception as e:
            print(f"❌ Error creating storage bucket: {str(e)}")
            return False

    def add_avatar_url_column(self):
        """Ensure avatar_url column exists in profiles table"""
        sql = """
        -- Add avatar_url column if it doesn't exist
        DO $$ 
        BEGIN 
            BEGIN
                ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
                RAISE NOTICE 'Column avatar_url added to profiles table';
            EXCEPTION
                WHEN duplicate_column THEN 
                RAISE NOTICE 'Column avatar_url already exists in profiles table';
            END;
        END $$;
        """
        
        return self.execute_sql(sql, "Adding avatar_url column to profiles")

    def create_all_tables(self):
        """Create all tables and setup database structure"""
        print("🚀 Setting up database structure...")
        print("="*50)
        
        success_count = 0
        total_operations = 8
        
        operations = [
            ("Profiles table", self.create_profiles_table),
            ("Recipes table", self.create_recipes_table),
            ("Recipe votes table", self.create_recipe_votes_table),
            ("Follows table", self.create_follows_table),
            ("Saved recipes table", self.create_saved_recipes_table),
            ("Activities table", self.create_activities_table),
            ("Hashtags table", self.create_hashtags_table),
            ("Avatar URL column", self.add_avatar_url_column),
        ]
        
        for name, operation in operations:
            if operation():
                success_count += 1
            print()
        
        # Create storage bucket (separate from SQL operations)
        if self.create_storage_bucket():
            success_count += 1
        
        print("="*50)
        print(f"✅ Database setup complete: {success_count}/{total_operations + 1} operations successful")
        
        if success_count == total_operations + 1:
            print("🎉 All database operations completed successfully!")
            return True
        else:
            print("⚠️  Some operations failed. Check the logs above.")
            return False

    def check_database_status(self):
        """Check the current status of database tables"""
        print("🔍 Checking database status...")
        print("="*50)
        
        tables_to_check = [
            'profiles', 'recipes', 'recipe_votes', 'follows', 
            'saved_recipes', 'activities', 'hashtags'
        ]
        
        for table in tables_to_check:
            try:
                result = self.supabase.table(table).select("count", count="exact").execute()
                count = result.count if hasattr(result, 'count') else 'Unknown'
                print(f"✅ {table}: {count} records")
            except Exception as e:
                print(f"❌ {table}: Error - {str(e)}")
        
        print("="*50)

    def fix_avatar_upload_issue(self):
        """Fix common avatar upload issues"""
        print("🔧 Fixing avatar upload issues...")
        
        # 1. Ensure avatar_url column exists
        self.add_avatar_url_column()
        
        # 2. Create storage bucket
        self.create_storage_bucket()
        
        # 3. Set up storage policies
        sql = """
        -- Enable storage for avatars bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true)
        ON CONFLICT (id) DO NOTHING;

        -- Create storage policy for avatars
        CREATE POLICY IF NOT EXISTS "Avatar images are publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');

        CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

        CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
        """
        
        self.execute_sql(sql, "Setting up storage policies for avatars")
        print("✅ Avatar upload fixes applied")

def main():
    """Main function to run database operations"""
    if len(sys.argv) < 2:
        print("Usage: python db_manager.py [command]")
        print("\nAvailable commands:")
        print("  setup     - Create all tables and setup database structure")
        print("  status    - Check current database status")
        print("  fix-avatar - Fix avatar upload issues")
        print("  profiles  - Create/update profiles table only")
        print("  recipes   - Create/update recipes table only")
        return
    
    command = sys.argv[1].lower()
    db = DatabaseManager()
    
    if command == "setup":
        db.create_all_tables()
    elif command == "status":
        db.check_database_status()
    elif command == "fix-avatar":
        db.fix_avatar_upload_issue()
    elif command == "profiles":
        db.create_profiles_table()
    elif command == "recipes":
        db.create_recipes_table()
    else:
        print(f"❌ Unknown command: {command}")
        return

if __name__ == "__main__":
    main() 