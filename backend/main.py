from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from datetime import datetime, timedelta
from supabase import create_client, Client
import jwt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="What'sYourRecipe API",
    description="Social media platform for coffee recipe sharing",
    version="1.0.0"
)

# Mount static files from frontend directory
# Serve CSS, JS, and other static files at root level
app.mount("/static", StaticFiles(directory="static"), name="static")

# Individual routes for main static files so they work with relative paths
@app.get("/styles.css")
async def get_styles():
    return FileResponse("static/styles.css", media_type="text/css")

@app.get("/script.js")
async def get_script():
    return FileResponse("static/script.js", media_type="application/javascript")

@app.get("/api.js")
async def get_api():
    return FileResponse("static/api.js", media_type="application/javascript")

# CORS middleware - Allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5500",  # Live Server default
        "http://127.0.0.1:5500",
        "https://coffee-m9ux.onrender.com",
        # Your deployed app URL
    ] + (os.getenv("FRONTEND_URLS", "").split(",") if os.getenv("FRONTEND_URLS") else []),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for backend operations
)

# Security
security = HTTPBearer()

# Pydantic models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    username: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Recipe(BaseModel):
    # Basic required fields
    recipe_name: str
    description: str
    rating: Optional[float] = None
    date_created: Optional[str] = None
    is_public: bool = True
    
    # Bean information
    bean_variety: Optional[str] = None
    bean_region: Optional[str] = None
    india_estate: Optional[str] = None
    processing_type: Optional[str] = None
    
    # Roasting profile
    roast_type: Optional[str] = None
    roast_level: Optional[str] = None
    crack_time: Optional[str] = None
    roast_time: Optional[float] = None
    development_time: Optional[float] = None
    
    # Brewing parameters
    brew_method: Optional[str] = None
    grind_microns: Optional[int] = None
    water_composition: Optional[str] = None
    tds: Optional[float] = None
    calcium: Optional[float] = None
    magnesium: Optional[float] = None
    potassium: Optional[float] = None
    sodium: Optional[float] = None
    coffee_amount: Optional[float] = None
    water_amount: Optional[float] = None
    water_temp: Optional[int] = None
    brew_time: Optional[float] = None
    
    # Serving preferences
    milk_preference: Optional[str] = None
    serving_temp: Optional[str] = None
    sweetener: Optional[str] = None
    sweetener_quantity: Optional[float] = None
    serving_size: Optional[float] = None
    
    # Sensory & evaluation
    aroma_notes: Optional[str] = None
    body: Optional[str] = None
    acidity_type: Optional[str] = None
    sweetness: Optional[str] = None
    balance: Optional[str] = None
    aftertaste: Optional[str] = None
    clean_cup: Optional[str] = None
    uniformity: Optional[str] = None
    cupping_score: Optional[float] = None
    cupping_method: Optional[str] = None
    defects: Optional[str] = None
    overall_impression: Optional[str] = None
    
    # Additional notes
    brewing_notes: Optional[str] = None

class Vote(BaseModel):
    recipe_id: str
    vote_type: str  # 'up' or 'down'

# Helper functions
def get_current_user(token: str = Depends(security)):
    try:
        # Verify JWT token with Supabase
        user = supabase.auth.get_user(token.credentials)
        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_user_access(user_id: str, current_user):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

# Auth endpoints
@app.post("/auth/signup")
async def signup(user_data: UserSignup):
    try:
        # Create user with Supabase Auth
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "username": user_data.username,
                    "full_name": user_data.full_name
                }
            }
        })
        
        if response.user:
            return {
                "message": "User created successfully. Please check your email for confirmation.",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "email_confirmed": response.user.email_confirmed_at is not None
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Signup failed")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(user_data: UserLogin):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if response.user and response.session:
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "username": response.user.user_metadata.get("username"),
                    "full_name": response.user.user_metadata.get("full_name")
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth/logout")
async def logout(current_user = Depends(get_current_user)):
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/resend-confirmation")
async def resend_confirmation(email: EmailStr):
    try:
        response = supabase.auth.resend({"type": "signup", "email": email})
        return {"message": "Confirmation email sent"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# User endpoints
@app.get("/users/profile")
async def get_user_profile(current_user = Depends(get_current_user)):
    try:
        print(f"Getting profile for user: {current_user.id}")
        result = supabase.table("profiles").select("*").eq("id", current_user.id).single().execute()
        print(f"Profile result: {result}")
        if result.data:
            return result.data
        else:
            # If no profile exists, create a basic one
            profile_data = {
                "id": current_user.id,
                "username": current_user.user_metadata.get("username", ""),
                "full_name": current_user.user_metadata.get("full_name", ""),
                "email": current_user.email
            }
            create_result = supabase.table("profiles").insert(profile_data).execute()
            print(f"Created profile: {create_result}")
            return profile_data
    except Exception as e:
        print(f"Profile error: {e}")
        # Return basic user info from auth if profile table doesn't exist
        return {
            "id": current_user.id,
            "username": current_user.user_metadata.get("username", ""),
            "full_name": current_user.user_metadata.get("full_name", ""),
            "email": current_user.email
        }

@app.get("/users/{user_id}")
async def get_user_by_id(user_id: str):
    try:
        result = supabase.table("profiles").select("id, username, full_name, bio, avatar_url, created_at").eq("id", user_id).single().execute()
        if result.data:
            return result.data
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=404, detail="User not found")

@app.get("/users/search/{query}")
async def search_users(query: str, limit: int = 10):
    try:
        result = supabase.table("profiles").select("id, username, full_name, bio, avatar_url").or_(f"username.ilike.%{query}%,full_name.ilike.%{query}%").limit(limit).execute()
        return result.data
    except Exception as e:
        return []

# Recipe endpoints
@app.post("/recipes")
async def create_recipe(recipe_data: Recipe, current_user = Depends(get_current_user)):
    try:
        recipe_dict = recipe_data.dict()
        recipe_dict["user_id"] = current_user.id
        
        # Log the data being sent for debugging
        print(f"Creating recipe with data: {recipe_dict}")
        
        result = supabase.table("recipes").insert(recipe_dict).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create recipe")
    except Exception as e:
        print(f"Error creating recipe: {e}")
        print(f"Recipe data: {recipe_dict}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/recipes")
async def get_recipes(
    page: int = 1,
    limit: int = 10,
    view: str = "feed",  # feed, trending, following, saved
    current_user = Depends(get_current_user)
):
    try:
        offset = (page - 1) * limit
        print(f"Getting recipes: page={page}, limit={limit}, view={view}, user={current_user.id}")
        
        # Simplified query for now - just get basic recipes without complex joins
        result = supabase.table("recipes").select("*").eq("is_public", True).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        print(f"Recipes result: {result}")
        return result.data or []
    except Exception as e:
        print(f"Error getting recipes: {e}")
        # Return empty list instead of error to avoid breaking the feed
        return []

@app.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: str):
    try:
        result = supabase.table("recipes").select("""
            *, profiles!recipes_user_id_fkey(username, full_name, avatar_url),
            votes(vote_type),
            recipe_votes_count:votes(count)
        """).eq("id", recipe_id).single().execute()
        
        if result.data:
            return result.data
        else:
            raise HTTPException(status_code=404, detail="Recipe not found")
    except Exception as e:
        raise HTTPException(status_code=404, detail="Recipe not found")

@app.get("/recipes/search/{query}")
async def search_recipes(query: str, limit: int = 10):
    try:
        result = supabase.table("recipes").select("""
            *, profiles!recipes_user_id_fkey(username, full_name, avatar_url)
        """).or_(f"title.ilike.%{query}%,coffee_name.ilike.%{query}%,tasting_notes.ilike.%{query}%").eq("is_public", True).limit(limit).execute()
        return result.data
    except Exception as e:
        return []

# Voting endpoints
@app.post("/votes")
async def cast_vote(vote_data: Vote, current_user = Depends(get_current_user)):
    try:
        # Check if user already voted
        existing_vote = supabase.table("votes").select("*").eq("recipe_id", vote_data.recipe_id).eq("user_id", current_user.id).execute()
        
        if existing_vote.data:
            # Update existing vote
            if existing_vote.data[0]["vote_type"] == vote_data.vote_type:
                # Remove vote if same type
                supabase.table("votes").delete().eq("id", existing_vote.data[0]["id"]).execute()
                return {"message": "Vote removed"}
            else:
                # Update vote type
                result = supabase.table("votes").update({"vote_type": vote_data.vote_type}).eq("id", existing_vote.data[0]["id"]).execute()
                return {"message": "Vote updated", "vote": result.data[0]}
        else:
            # Create new vote
            vote_dict = vote_data.dict()
            vote_dict["user_id"] = current_user.id
            result = supabase.table("votes").insert(vote_dict).execute()
            return {"message": "Vote cast", "vote": result.data[0]}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Follow endpoints
@app.post("/follow/{user_id}")
async def follow_user(user_id: str, current_user = Depends(get_current_user)):
    try:
        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
        # Check if already following
        existing = supabase.table("follows").select("*").eq("follower_id", current_user.id).eq("following_id", user_id).execute()
        
        if existing.data:
            # Unfollow
            supabase.table("follows").delete().eq("id", existing.data[0]["id"]).execute()
            return {"message": "Unfollowed", "following": False}
        else:
            # Follow
            result = supabase.table("follows").insert({
                "follower_id": current_user.id,
                "following_id": user_id
            }).execute()
            return {"message": "Following", "following": True}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Serve the frontend at root
@app.get("/")
@app.head("/")
async def serve_frontend():
    return FileResponse("static/index.html")

# Environment detection
def get_environment():
    return "production" if os.getenv("PORT") else "development"

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "environment": get_environment(),
        "timestamp": datetime.now().isoformat()
    }

# Environment info endpoint
@app.get("/env")
async def environment_info():
    return {
        "environment": get_environment(),
        "api_url": f"http://localhost:{os.getenv('PORT', 8000)}" if get_environment() == "development" else "https://coffee-m9ux.onrender.com",
        "port": os.getenv("PORT", 8000)
    }

# Database test endpoint
@app.get("/test-db")
async def test_database():
    try:
        # Test Supabase connection
        result = supabase.table("recipes").select("count", count="exact").execute()
        return {
            "status": "success",
            "supabase_url": os.getenv("SUPABASE_URL") is not None,
            "supabase_key": os.getenv("SUPABASE_SERVICE_KEY") is not None,
            "recipes_count": result.count if hasattr(result, 'count') else 0
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "supabase_url": os.getenv("SUPABASE_URL") is not None,
            "supabase_key": os.getenv("SUPABASE_SERVICE_KEY") is not None
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    environment = get_environment()
    
    print(f"\n🚀 What'sYourRecipe API Starting...")
    print(f"📍 Environment: {environment.upper()}")
    print(f"🌐 Server: http://localhost:{port}")
    print(f"📱 Frontend: http://localhost:{port}")
    print(f"🔗 API Docs: http://localhost:{port}/docs")
    print(f"❤️  Health Check: http://localhost:{port}/health")
    print("="*50)
    
    uvicorn.run(app, host="0.0.0.0", port=port) 