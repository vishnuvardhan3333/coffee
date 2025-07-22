# Database Management for What'sYourRecipe

This directory contains tools to manage your Supabase database structure and troubleshoot issues.

## 🚀 Quick Setup

### 1. Environment Setup
```bash
# Create environment file template
python setup_env.py create

# Edit the .env file with your Supabase credentials
# Get them from: https://supabase.com/dashboard -> Your Project -> Settings -> API
```

### 2. Database Setup
```bash
# Set up all database tables and structure
python db_manager.py setup

# Check database status
python db_manager.py status

# Fix avatar upload issues specifically
python db_manager.py fix-avatar
```

## 🔧 Database Management Commands

### Schema Checking and Updates
```bash
# Check if all columns exist in all tables
python check_and_update_schema.py

# Quick status check of all tables
python simple_hashtags_fix.py check
```

### Complete Database Schema Update
```bash
# For comprehensive schema updates, use the SQL script:
# 1. Copy content from 'update_database_schema.sql'
# 2. Paste into Supabase SQL Editor
# 3. Click 'Run'
```

### Legacy Database Manager (Limited)
```bash
python db_manager.py status     # Check basic table status
python db_manager.py fix-avatar # Try to fix avatar issues
```

**Note:** The original `db_manager.py` has limitations with Supabase's security restrictions. Use the SQL script for actual schema updates.

## 🗄️ Database Structure

### Core Tables
- **profiles** - User profile information
- **recipes** - Coffee recipes with full brewing details
- **recipe_votes** - Upvotes/downvotes on recipes
- **follows** - User follow relationships
- **saved_recipes** - User's saved recipes
- **activities** - Activity feed data
- **hashtags** - Trending hashtags

### Storage
- **avatars** bucket - User profile pictures

## 🐛 Troubleshooting

### Avatar Upload Issues
If you're getting "error uploading avatar":

1. **Run the fix command:**
   ```bash
   python db_manager.py fix-avatar
   ```

2. **Check your environment:**
   ```bash
   python setup_env.py check
   ```

3. **Ensure you have the service key** (not just anon key) in your `.env`:
   ```
   SUPABASE_SERVICE_KEY=your_service_key_here
   ```

### Recipe View Issues (404 errors)
If recipes show 404 errors:

1. **Check database status:**
   ```bash
   python db_manager.py status
   ```

2. **Verify your recipes table:**
   ```bash
   python db_manager.py recipes
   ```

### Profile Update Issues
If profile updates fail:

1. **Fix profiles table:**
   ```bash
   python db_manager.py profiles
   ```

2. **Check RLS policies are set correctly**

## 🔒 Security Notes

- The database manager uses your **SUPABASE_SERVICE_KEY** for admin operations
- Row Level Security (RLS) is enabled on all tables
- Users can only modify their own data (enforced by policies)
- Storage policies ensure users can only upload to their own folders

## 📝 Environment Variables Required

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key  # Required for db_manager
JWT_SECRET=your_jwt_secret
```

## 📁 Database Management Files

- **`check_and_update_schema.py`** - Python script to check for missing columns
- **`update_database_schema.sql`** - Complete SQL script to add missing columns
- **`simple_hashtags_fix.py`** - Quick status checker for all tables
- **`db_manager.py`** - Legacy database manager (limited functionality)
- **`setup_env.py`** - Environment setup helper

## 🆘 Need Help?

1. **Check schema first** - `python check_and_update_schema.py`
2. **Quick status check** - `python simple_hashtags_fix.py check`
3. **Check the logs** - All scripts provide detailed output
4. **Verify credentials** - Make sure your Supabase keys are correct
5. **Use SQL script** - For major updates, use `update_database_schema.sql`

The database tools are designed to be **safe to run multiple times** - they won't break existing data. 