#!/usr/bin/env python3
"""
Simple fix for missing hashtags table
Uses Supabase client to create records directly instead of raw SQL
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_sample_hashtags():
    """Create sample hashtags if table exists but is empty"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set")
        return False
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Sample hashtags to create
    sample_hashtags = [
        {'tag': 'espresso', 'usage_count': 5},
        {'tag': 'pourover', 'usage_count': 3},
        {'tag': 'coldBrew', 'usage_count': 2},
        {'tag': 'frenchPress', 'usage_count': 4},
        {'tag': 'aeropress', 'usage_count': 3},
        {'tag': 'v60', 'usage_count': 2},
        {'tag': 'chemex', 'usage_count': 2},
        {'tag': 'arabica', 'usage_count': 6},
        {'tag': 'robusta', 'usage_count': 1},
        {'tag': 'lightRoast', 'usage_count': 4}
    ]
    
    try:
        # Check if hashtags table exists by trying to query it
        result = supabase.table("hashtags").select("count", count="exact").execute()
        current_count = result.count if hasattr(result, 'count') else 0
        
        print(f"✅ Hashtags table exists with {current_count} records")
        
        if current_count == 0:
            print("🔄 Adding sample hashtags...")
            
            # Insert sample hashtags
            insert_result = supabase.table("hashtags").insert(sample_hashtags).execute()
            
            if insert_result.data:
                print(f"✅ Added {len(insert_result.data)} sample hashtags")
                return True
            else:
                print("❌ Failed to insert hashtags")
                return False
        else:
            print("ℹ️  Hashtags table already has data")
            return True
            
    except Exception as e:
        print(f"❌ Error with hashtags table: {str(e)}")
        print("\n💡 The hashtags table likely doesn't exist.")
        print("📝 To fix this, run the SQL script in your Supabase dashboard:")
        print("   1. Go to https://supabase.com/dashboard")
        print("   2. Select your project")
        print("   3. Go to SQL Editor")
        print("   4. Run the SQL from 'create_hashtags_table.sql'")
        return False

def check_all_tables():
    """Check status of all tables"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    tables_to_check = [
        'profiles', 'recipes', 'recipe_votes', 'follows', 
        'saved_recipes', 'activities', 'hashtags'
    ]
    
    print("🔍 Checking all tables...")
    print("="*50)
    
    all_good = True
    
    for table in tables_to_check:
        try:
            result = supabase.table(table).select("count", count="exact").execute()
            count = result.count if hasattr(result, 'count') else 'Unknown'
            print(f"✅ {table}: {count} records")
        except Exception as e:
            print(f"❌ {table}: {str(e)}")
            all_good = False
    
    print("="*50)
    
    if all_good:
        print("🎉 All tables are working!")
    else:
        print("⚠️  Some tables have issues")
    
    return all_good

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        check_all_tables()
    else:
        create_sample_hashtags() 