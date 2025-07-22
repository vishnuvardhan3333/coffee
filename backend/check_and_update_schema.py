#!/usr/bin/env python3
"""
Database Schema Checker and Updater for What'sYourRecipe
Checks for missing columns and reports what needs to be updated
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SchemaChecker:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
            exit(1)
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        print(f"✅ Connected to Supabase: {self.supabase_url}")

    def get_table_columns(self, table_name):
        """Get existing columns for a table"""
        try:
            # Query information_schema to get columns
            query = f"""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = '{table_name}'
            ORDER BY ordinal_position;
            """
            
            # This is a workaround since we can't execute raw SQL
            # We'll check by trying to select specific columns
            result = self.supabase.table(table_name).select("*").limit(1).execute()
            
            if result.data and len(result.data) > 0:
                return list(result.data[0].keys())
            else:
                # Try to get structure by inserting/selecting
                result = self.supabase.table(table_name).select("*").limit(0).execute()
                return []
                
        except Exception as e:
            print(f"❌ Error getting columns for {table_name}: {str(e)}")
            return None

    def check_table_schema(self, table_name, required_columns):
        """Check if table has all required columns"""
        print(f"\n🔍 Checking {table_name} table...")
        
        existing_columns = self.get_table_columns(table_name)
        
        if existing_columns is None:
            print(f"❌ Table {table_name} does not exist or cannot be accessed")
            return False
        
        missing_columns = []
        for col_name, col_type in required_columns.items():
            if col_name not in existing_columns:
                missing_columns.append((col_name, col_type))
        
        if missing_columns:
            print(f"⚠️  Missing columns in {table_name}:")
            for col_name, col_type in missing_columns:
                print(f"   - {col_name} ({col_type})")
            return False
        else:
            print(f"✅ {table_name} has all required columns ({len(existing_columns)} columns)")
            return True

    def check_all_schemas(self):
        """Check all table schemas"""
        print("🚀 Checking database schema...")
        print("="*60)
        
        # Define required columns for each table
        schemas = {
            'profiles': {
                'id': 'UUID',
                'username': 'VARCHAR(50)',
                'full_name': 'VARCHAR(100)',
                'bio': 'TEXT',
                'avatar_url': 'TEXT',
                'created_at': 'TIMESTAMP',
                'updated_at': 'TIMESTAMP'
            },
            'recipes': {
                'id': 'UUID',
                'user_id': 'UUID',
                'recipe_name': 'VARCHAR(200)',
                'description': 'TEXT',
                'rating': 'DECIMAL(3,1)',
                'date_created': 'DATE',
                'is_public': 'BOOLEAN',
                # Bean information
                'bean_variety': 'VARCHAR(100)',
                'bean_region': 'VARCHAR(100)',
                'india_estate': 'VARCHAR(100)',
                'processing_type': 'VARCHAR(100)',
                # Roasting profile
                'roast_type': 'VARCHAR(100)',
                'roast_level': 'VARCHAR(100)',
                'crack_time': 'VARCHAR(50)',
                'roast_time': 'DECIMAL(5,2)',
                'development_time': 'DECIMAL(5,2)',
                # Brewing parameters
                'brew_method': 'VARCHAR(100)',
                'grind_microns': 'INTEGER',
                'water_composition': 'VARCHAR(100)',
                'tds': 'DECIMAL(5,2)',
                'calcium': 'DECIMAL(5,2)',
                'magnesium': 'DECIMAL(5,2)',
                'potassium': 'DECIMAL(5,2)',
                'sodium': 'DECIMAL(5,2)',
                'coffee_amount': 'DECIMAL(6,2)',
                'water_amount': 'DECIMAL(8,2)',
                'water_temp': 'INTEGER',
                'brew_time': 'DECIMAL(6,2)',
                # Serving preferences
                'milk_preference': 'VARCHAR(100)',
                'serving_temp': 'VARCHAR(50)',
                'sweetener': 'VARCHAR(100)',
                'sweetener_quantity': 'DECIMAL(5,2)',
                'serving_size': 'DECIMAL(6,2)',
                # Sensory & evaluation
                'aroma_notes': 'TEXT',
                'body': 'VARCHAR(100)',
                'acidity_type': 'VARCHAR(100)',
                'sweetness': 'VARCHAR(100)',
                'balance': 'VARCHAR(100)',
                'aftertaste': 'VARCHAR(100)',
                'clean_cup': 'VARCHAR(100)',
                'uniformity': 'VARCHAR(100)',
                'cupping_score': 'DECIMAL(5,2)',
                'cupping_method': 'VARCHAR(100)',
                'defects': 'TEXT',
                'overall_impression': 'TEXT',
                # Additional notes
                'brewing_notes': 'TEXT',
                'created_at': 'TIMESTAMP',
                'updated_at': 'TIMESTAMP'
            },
            'recipe_votes': {
                'id': 'UUID',
                'recipe_id': 'UUID',
                'user_id': 'UUID',
                'vote_type': 'VARCHAR(10)',
                'created_at': 'TIMESTAMP'
            },
            'follows': {
                'id': 'UUID',
                'follower_id': 'UUID',
                'following_id': 'UUID',
                'created_at': 'TIMESTAMP'
            },
            'saved_recipes': {
                'id': 'UUID',
                'user_id': 'UUID',
                'recipe_id': 'UUID',
                'created_at': 'TIMESTAMP'
            },
            'activities': {
                'id': 'UUID',
                'user_id': 'UUID',
                'activity_type': 'VARCHAR(50)',
                'content': 'TEXT',
                'recipe_id': 'UUID',
                'target_user_id': 'UUID',
                'created_at': 'TIMESTAMP'
            },
            'hashtags': {
                'id': 'UUID',
                'tag': 'VARCHAR(100)',
                'usage_count': 'INTEGER',
                'last_used': 'TIMESTAMP',
                'created_at': 'TIMESTAMP'
            }
        }
        
        all_good = True
        issues_found = []
        
        for table_name, required_columns in schemas.items():
            if not self.check_table_schema(table_name, required_columns):
                all_good = False
                issues_found.append(table_name)
        
        print("\n" + "="*60)
        
        if all_good:
            print("🎉 All database schemas are up to date!")
        else:
            print(f"⚠️  Schema issues found in: {', '.join(issues_found)}")
            print("\n💡 To fix these issues:")
            print("1. Run the SQL script: update_database_schema.sql")
            print("2. Copy and paste it in your Supabase SQL Editor")
            print("3. Click 'Run' to update the schema")
        
        return all_good

    def generate_alter_statements(self):
        """Generate ALTER TABLE statements for missing columns"""
        print("📝 Generating ALTER TABLE statements...")
        
        # This would require more complex logic to check each column
        # For now, recommend using the SQL script
        print("💡 Use the update_database_schema.sql file for complete column updates")

def main():
    import sys
    
    checker = SchemaChecker()
    
    if len(sys.argv) > 1 and sys.argv[1] == "generate":
        checker.generate_alter_statements()
    else:
        checker.check_all_schemas()

if __name__ == "__main__":
    main() 