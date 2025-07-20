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
app.mount("/static", StaticFiles(directory="static"), name="static")

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
    title: str
    coffee_name: str
    roast_level: str
    grind_microns: int
    coffee_amount: float
    water_temp: int
    extraction_time: str
    total_yield: float
    is_public: bool = True
    # Basic variables
    method: Optional[str] = None
    water_amount: Optional[float] = None
    ratio: Optional[str] = None
    # Professional variables
    pre_infusion_time: Optional[str] = None
    bloom_time: Optional[str] = None
    water_quality: Optional[str] = None
    equipment: Optional[str] = None
    filter_type: Optional[str] = None
    pressure_profile: Optional[str] = None
    # Sensory
    aroma: Optional[str] = None
    flavor: Optional[str] = None
    aftertaste: Optional[str] = None
    acidity: Optional[int] = None
    body: Optional[int] = None
    balance: Optional[int] = None
    sweetness: Optional[int] = None
    overall_score: Optional[int] = None
    tasting_notes: Optional[str] = None
    # Additional
    notes: Optional[str] = None

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
        result = supabase.table("profiles").select("*").eq("id", current_user.id).single().execute()
        if result.data:
            return result.data
        else:
            raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        raise HTTPException(status_code=404, detail="Profile not found")

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
        
        result = supabase.table("recipes").insert(recipe_dict).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create recipe")
    except Exception as e:
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
        
        if view == "following":
            # Get recipes from followed users
            result = supabase.table("recipes").select("""
                *, profiles!recipes_user_id_fkey(username, full_name, avatar_url),
                votes(vote_type),
                recipe_votes_count:votes(count)
            """).in_("user_id", 
                supabase.table("follows").select("following_id").eq("follower_id", current_user.id).execute().data
            ).eq("is_public", True).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        elif view == "saved":
            # Get saved recipes
            saved_recipe_ids = [item["recipe_id"] for item in supabase.table("saved_recipes").select("recipe_id").eq("user_id", current_user.id).execute().data]
            result = supabase.table("recipes").select("""
                *, profiles!recipes_user_id_fkey(username, full_name, avatar_url),
                votes(vote_type),
                recipe_votes_count:votes(count)
            """).in_("id", saved_recipe_ids).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        elif view == "trending":
            # Get trending recipes (most upvotes in last 7 days)
            result = supabase.table("recipes").select("""
                *, profiles!recipes_user_id_fkey(username, full_name, avatar_url),
                votes(vote_type),
                recipe_votes_count:votes(count)
            """).eq("is_public", True).gte("created_at", (datetime.now() - timedelta(days=7)).isoformat()).order("vote_score", desc=True).range(offset, offset + limit - 1).execute()
        
        else:  # feed
            # Get all public recipes
            result = supabase.table("recipes").select("""
                *, profiles!recipes_user_id_fkey(username, full_name, avatar_url),
                votes(vote_type),
                recipe_votes_count:votes(count)
            """).eq("is_public", True).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return result.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000))) 