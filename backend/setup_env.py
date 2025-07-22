#!/usr/bin/env python3
"""
Environment Setup Script for What'sYourRecipe
Helps configure environment variables
"""

import os

def create_env_file():
    """Create .env file with template"""
    env_content = """# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# JWT Configuration  
JWT_SECRET=your_jwt_secret_here

# Environment
ENVIRONMENT=development
"""
    
    if os.path.exists('.env'):
        print("⚠️  .env file already exists!")
        response = input("Do you want to overwrite it? (y/N): ")
        if response.lower() != 'y':
            print("❌ Cancelled")
            return False
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env file")
    print("📝 Please edit .env file and add your Supabase credentials")
    print("\nTo get your Supabase credentials:")
    print("1. Go to https://supabase.com/dashboard")
    print("2. Select your project")  
    print("3. Go to Settings > API")
    print("4. Copy the URL and keys")
    return True

def check_env():
    """Check if environment variables are set"""
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY', 
        'SUPABASE_SERVICE_KEY',
        'JWT_SECRET'
    ]
    
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n💡 Run 'python setup_env.py create' to create .env template")
        return False
    else:
        print("✅ All environment variables are set!")
        return True

def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python setup_env.py [command]")
        print("\nCommands:")
        print("  create - Create .env file template")
        print("  check  - Check if environment variables are set")
        return
    
    command = sys.argv[1].lower()
    
    if command == "create":
        create_env_file()
    elif command == "check":
        check_env()
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    main() 