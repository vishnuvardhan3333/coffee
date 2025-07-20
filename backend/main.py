from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, ValidationError
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

# Add validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation error on {request.method} {request.url}")
    print(f"Validation errors: {exc.errors()}")
    
    # Try to get request body safely
    try:
        body = await request.body()
        print(f"Request body: {body}")
        body_str = body.decode('utf-8') if body else "Empty body"
    except Exception as e:
        print(f"Could not read request body: {e}")
        body_str = "Could not read body"
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": body_str,
            "url": str(request.url)
        }
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
async def ensure_user_profile(current_user):
    """Ensure a profile exists for the current user, create if missing"""
    try:
        # Try to get existing profile
        result = supabase.table("profiles").select("*").eq("id", current_user.id).single().execute()
        if result.data:
            return result.data
    except Exception as e:
        print(f"Profile not found: {e}")
    
    # Create profile if it doesn't exist
    try:
        profile_data = {
            "id": current_user.id,
            "username": current_user.user_metadata.get("username", f"user_{current_user.id[:8]}"),
            "full_name": current_user.user_metadata.get("full_name", ""),
            "email": current_user.email
        }
        create_result = supabase.table("profiles").insert(profile_data).execute()
        print(f"Created new profile: {create_result}")
        if create_result.data:
            return create_result.data[0]
        else:
            return profile_data
    except Exception as e:
        print(f"Error creating profile: {e}")
        # Return basic profile data even if creation fails
        return {
            "id": current_user.id,
            "username": current_user.user_metadata.get("username", f"user_{current_user.id[:8]}"),
            "full_name": current_user.user_metadata.get("full_name", ""),
            "email": current_user.email
        }

@app.get("/users/profile")
async def get_user_profile(current_user = Depends(get_current_user)):
    return await ensure_user_profile(current_user)

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
        # Ensure user profile exists before creating recipe
        await ensure_user_profile(current_user)
        
        # Convert to dict using model_dump (Pydantic v2 method)
        recipe_dict = recipe_data.model_dump()
        recipe_dict["user_id"] = current_user.id
        
        print(f"Creating recipe: {recipe_data.recipe_name}")
        
        result = supabase.table("recipes").insert(recipe_dict).execute()
        
        if result.data:
            print(f"Recipe created successfully: {result.data[0]['id']}")
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create recipe")
    except Exception as e:
        print(f"Error creating recipe: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/recipes")
async def get_recipes(
    page: int = 1,
    limit: int = 10,
    view: str = "feed",  # feed, trending, following, saved
    trending_days: int = 7,  # 1 for daily, 7 for weekly trending
    current_user = Depends(get_current_user)
):
    try:
        offset = (page - 1) * limit
        print(f"Getting recipes: page={page}, limit={limit}, view={view}, user={current_user.id}")
        
        base_query = """
            *, 
            profiles!recipes_user_id_fkey(id, username, full_name, avatar_url),
            recipe_votes(vote_type, user_id)
        """
        
        if view == "following":
            # Get recipes from followed users
            followed_users_result = supabase.table("follows").select("following_id").eq("follower_id", current_user.id).execute()
            followed_user_ids = [follow["following_id"] for follow in followed_users_result.data] if followed_users_result.data else []
            
            if not followed_user_ids:
                return []  # No followed users
            
            result = supabase.table("recipes").select(base_query).in_("user_id", followed_user_ids).eq("is_public", True).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        elif view == "saved":
            # Get saved recipes
            saved_recipes_result = supabase.table("saved_recipes").select("recipe_id").eq("user_id", current_user.id).execute()
            saved_recipe_ids = [save["recipe_id"] for save in saved_recipes_result.data] if saved_recipes_result.data else []
            
            if not saved_recipe_ids:
                return []  # No saved recipes
            
            result = supabase.table("recipes").select(base_query).in_("id", saved_recipe_ids).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        elif view == "trending":
            # Get trending recipes (most upvotes in specified timeframe) 
            days_ago = (datetime.now() - timedelta(days=trending_days)).isoformat()
            
            # First get all public recipes from specified timeframe
            result = supabase.table("recipes").select(base_query).eq("is_public", True).gte("created_at", days_ago).order("created_at", desc=True).execute()
            
            # Sort by upvote count in Python since Supabase doesn't support complex aggregations in this context
            if result.data:
                for recipe in result.data:
                    upvotes = len([v for v in recipe.get("recipe_votes", []) if v["vote_type"] == "up"])
                    downvotes = len([v for v in recipe.get("recipe_votes", []) if v["vote_type"] == "down"])
                    recipe["vote_score"] = upvotes - downvotes
                
                # Sort by vote score
                result.data.sort(key=lambda x: x.get("vote_score", 0), reverse=True)
                
                # Apply pagination manually
                result.data = result.data[offset:offset + limit]
        
        else:  # feed - smart home feed
            # Get recipes from followed users + trending recipes
            followed_users_result = supabase.table("follows").select("following_id").eq("follower_id", current_user.id).execute()
            followed_user_ids = [follow["following_id"] for follow in followed_users_result.data] if followed_users_result.data else []
            
            if followed_user_ids:
                # Mix of followed users' recipes and trending recipes
                followed_result = supabase.table("recipes").select(base_query).in_("user_id", followed_user_ids).eq("is_public", True).order("created_at", desc=True).limit(limit // 2).execute()
                
                trending_result = supabase.table("recipes").select(base_query).eq("is_public", True).order("created_at", desc=True).limit(limit // 2).execute()
                
                # Combine and sort by creation date
                combined_recipes = (followed_result.data or []) + (trending_result.data or [])
                combined_recipes.sort(key=lambda x: x["created_at"], reverse=True)
                
                result = type('obj', (object,), {'data': combined_recipes[:limit]})
            else:
                # Just show trending recipes if not following anyone
                result = supabase.table("recipes").select(base_query).eq("is_public", True).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        print(f"Recipes result count: {len(result.data) if result.data else 0}")
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
            *, 
            profiles!recipes_user_id_fkey(id, username, full_name, avatar_url),
            recipe_votes(vote_type, user_id)
        """).or_(f"recipe_name.ilike.%{query}%,description.ilike.%{query}%,brewing_notes.ilike.%{query}%").eq("is_public", True).limit(limit).execute()
        return result.data or []
    except Exception as e:
        print(f"Recipe search error: {e}")
        return []

# Voting endpoints
@app.post("/votes")
async def cast_vote(vote_data: Vote, current_user = Depends(get_current_user)):
    try:
        # Ensure user profile exists
        await ensure_user_profile(current_user)
        
        # Check if user already voted
        existing_vote = supabase.table("recipe_votes").select("*").eq("recipe_id", vote_data.recipe_id).eq("user_id", current_user.id).execute()
        
        if existing_vote.data:
            # Update existing vote
            if existing_vote.data[0]["vote_type"] == vote_data.vote_type:
                # Remove vote if same type
                supabase.table("recipe_votes").delete().eq("id", existing_vote.data[0]["id"]).execute()
                return {"message": "Vote removed", "action": "removed"}
            else:
                # Update vote type
                result = supabase.table("recipe_votes").update({"vote_type": vote_data.vote_type}).eq("id", existing_vote.data[0]["id"]).execute()
                return {"message": "Vote updated", "action": "updated", "vote": result.data[0]}
        else:
            # Create new vote
            vote_dict = vote_data.model_dump()
            vote_dict["user_id"] = current_user.id
            result = supabase.table("recipe_votes").insert(vote_dict).execute()
            return {"message": "Vote cast", "action": "created", "vote": result.data[0]}
            
    except Exception as e:
        print(f"Vote error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Follow endpoints
@app.post("/follow/{user_id}")
async def follow_user(user_id: str, current_user = Depends(get_current_user)):
    try:
        # Ensure both users have profiles
        await ensure_user_profile(current_user)
        
        # Check if target user exists by checking profiles table
        target_profile = supabase.table("profiles").select("id").eq("id", user_id).execute()
        if not target_profile.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
        # Check if already following
        existing = supabase.table("follows").select("*").eq("follower_id", current_user.id).eq("following_id", user_id).execute()
        
        if existing.data:
            # Unfollow
            supabase.table("follows").delete().eq("id", existing.data[0]["id"]).execute()
            return {"message": "Unfollowed", "following": False, "action": "unfollowed"}
        else:
            # Follow
            result = supabase.table("follows").insert({
                "follower_id": current_user.id,
                "following_id": user_id
            }).execute()
            return {"message": "Following", "following": True, "action": "followed"}
            
    except Exception as e:
        print(f"Follow error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Get user's following status
@app.get("/follow-status/{user_id}")
async def get_follow_status(user_id: str, current_user = Depends(get_current_user)):
    try:
        result = supabase.table("follows").select("*").eq("follower_id", current_user.id).eq("following_id", user_id).execute()
        return {"following": len(result.data) > 0}
    except Exception as e:
        return {"following": False}

# Get user's followers and following counts
@app.get("/user-stats/{user_id}")
async def get_user_stats(user_id: str):
    try:
        followers = supabase.table("follows").select("*", count="exact").eq("following_id", user_id).execute()
        following = supabase.table("follows").select("*", count="exact").eq("follower_id", user_id).execute()
        recipes = supabase.table("recipes").select("*", count="exact").eq("user_id", user_id).eq("is_public", True).execute()
        
        return {
            "followers_count": followers.count or 0,
            "following_count": following.count or 0,
            "recipes_count": recipes.count or 0
        }
    except Exception as e:
        print(f"User stats error: {e}")
        return {"followers_count": 0, "following_count": 0, "recipes_count": 0}

# Get user's recipes
@app.get("/users/{user_id}/recipes")
async def get_user_recipes(user_id: str, page: int = 1, limit: int = 20):
    try:
        offset = (page - 1) * limit
        
        result = supabase.table("recipes").select("""
            *, 
            profiles!recipes_user_id_fkey(id, username, full_name, avatar_url),
            recipe_votes(vote_type, user_id)
        """).eq("user_id", user_id).eq("is_public", True).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return result.data or []
    except Exception as e:
        print(f"Error getting user recipes: {e}")
        return []

# Get intelligent user recommendations 
@app.get("/recommended-users")
async def get_recommended_users(limit: int = 5, current_user = Depends(get_current_user)):
    try:
        await ensure_user_profile(current_user)
        
        # Get users that current user has upvoted recipes from
        upvoted_recipes = supabase.table("recipe_votes").select("recipe_id").eq("user_id", current_user.id).eq("vote_type", "up").execute()
        upvoted_recipe_ids = [vote["recipe_id"] for vote in upvoted_recipes.data] if upvoted_recipes.data else []
        
        # Get users who created those upvoted recipes
        similar_users = set()
        if upvoted_recipe_ids:
            recipes_result = supabase.table("recipes").select("user_id").in_("id", upvoted_recipe_ids).execute()
            similar_users = set([recipe["user_id"] for recipe in recipes_result.data]) if recipes_result.data else set()
        
        # Get users that current user is already following
        following_result = supabase.table("follows").select("following_id").eq("follower_id", current_user.id).execute()
        following_ids = set([follow["following_id"] for follow in following_result.data]) if following_result.data else set()
        
        # Add current user to exclusion list
        following_ids.add(current_user.id)
        
        # Get users who have similar voting patterns (liked by people who liked same recipes)
        recommended_user_ids = set()
        
        # Get other users who also upvoted the same recipes
        if upvoted_recipe_ids:
            other_votes = supabase.table("recipe_votes").select("user_id").in_("recipe_id", upvoted_recipe_ids).eq("vote_type", "up").neq("user_id", current_user.id).execute()
            other_user_ids = [vote["user_id"] for vote in other_votes.data] if other_votes.data else []
            
            # Count frequency and get most similar users
            from collections import Counter
            user_similarity = Counter(other_user_ids)
            
            # Get top similar users who aren't already followed
            for user_id, count in user_similarity.most_common():
                if user_id not in following_ids and len(recommended_user_ids) < limit * 2:
                    recommended_user_ids.add(user_id)
        
        # Also add some popular users (with most followers) as fallback
        if len(recommended_user_ids) < limit:
            popular_users = supabase.table("follows").select("following_id, count(*)", count="exact").group_by("following_id").order("count", desc=True).limit(10).execute()
            
            if popular_users.data:
                for user_stat in popular_users.data:
                    user_id = user_stat["following_id"]
                    if user_id not in following_ids and user_id not in recommended_user_ids and len(recommended_user_ids) < limit:
                        recommended_user_ids.add(user_id)
        
        # Get user profiles for recommendations
        if recommended_user_ids:
            users_result = supabase.table("profiles").select("*").in_("id", list(recommended_user_ids)).limit(limit).execute()
            return users_result.data or []
        else:
            # Fallback: get some random active users
            random_users = supabase.table("profiles").select("*").not_.in_("id", list(following_ids)).limit(limit).execute()
            return random_users.data or []
            
    except Exception as e:
        print(f"Error getting recommended users: {e}")
        # Fallback: return some users excluding those already followed
        try:
            following_result = supabase.table("follows").select("following_id").eq("follower_id", current_user.id).execute()
            following_ids = [follow["following_id"] for follow in following_result.data] if following_result.data else []
            following_ids.append(current_user.id)  # Exclude current user
            
            fallback_users = supabase.table("profiles").select("*").not_.in_("id", following_ids).limit(limit).execute()
            return fallback_users.data or []
        except:
            return []

# Get activity feed for current user
@app.get("/activity-feed")
async def get_activity_feed(limit: int = 10, current_user = Depends(get_current_user)):
    try:
        await ensure_user_profile(current_user)
        
        # Get activities where current user is the target (people interacting with their content)
        # OR activities from people they follow
        
        # Get users that current user follows
        following_result = supabase.table("follows").select("following_id").eq("follower_id", current_user.id).execute()
        following_ids = [follow["following_id"] for follow in following_result.data] if following_result.data else []
        
        # Get activities where:
        # 1. Target user is current user (people liking their recipes, following them)
        # 2. OR user is someone they follow (recipe creations)
        
        query_conditions = []
        
        # Activities targeting current user
        query_conditions.append(f"target_user_id.eq.{current_user.id}")
        
        # Activities from followed users (recipe creations, etc.)
        if following_ids:
            user_conditions = ",".join([f"user_id.eq.{uid}" for uid in following_ids])
            query_conditions.append(f"or({user_conditions})")
        
        # Combine conditions
        final_condition = ",".join(query_conditions)
        
        result = supabase.table("activities").select("""
            *,
            user_profile:profiles!activities_user_id_fkey(id, username, full_name, avatar_url),
            target_profile:profiles!activities_target_user_id_fkey(id, username, full_name, avatar_url),
            recipe:recipes(id, recipe_name)
        """).or_(final_condition).order("created_at", desc=True).limit(limit).execute()
        
        return result.data or []
        
    except Exception as e:
        print(f"Error getting activity feed: {e}")
        return []

# Get trending hashtags
@app.get("/trending-hashtags")
async def get_trending_hashtags_endpoint(limit: int = 10, days_back: int = 1):
    try:
        result = supabase.rpc('get_trending_hashtags', {
            'limit_count': limit,
            'days_back': days_back
        }).execute()
        return result.data or []
    except Exception as e:
        print(f"Error getting trending hashtags: {e}")
        # Fallback: get some hashtags from recent recipes
        try:
            recent_hashtags = supabase.table("hashtags").select("*").order("last_used", desc=True).limit(limit).execute()
            return recent_hashtags.data or []
        except:
            return []

# Get recipes by hashtag
@app.get("/recipes/hashtag/{hashtag}")
async def get_recipes_by_hashtag_endpoint(hashtag: str, sort_by: str = "recent", limit: int = 20):
    try:
        result = supabase.rpc('get_recipes_by_hashtag', {
            'hashtag_name': hashtag,
            'sort_by': sort_by,
            'limit_count': limit
        }).execute()
        
        # Enhance with profile information
        if result.data:
            recipe_ids = [recipe["recipe_id"] for recipe in result.data]
            recipes_with_profiles = supabase.table("recipes").select("""
                *, 
                profiles!recipes_user_id_fkey(id, username, full_name, avatar_url),
                recipe_votes(vote_type, user_id)
            """).in_("id", recipe_ids).execute()
            
            return recipes_with_profiles.data or []
        
        return []
    except Exception as e:
        print(f"Error getting recipes by hashtag: {e}")
        return []

# Serve the frontend at root
@app.get("/")
@app.head("/")
async def serve_frontend():
    return FileResponse("static/index.html")

# Environment detection
def get_environment():
    return "production" if os.getenv("PORT") else "development"

# Saved recipes endpoints
@app.post("/save-recipe/{recipe_id}")
async def save_recipe(recipe_id: str, current_user = Depends(get_current_user)):
    try:
        await ensure_user_profile(current_user)
        
        # Check if already saved
        existing = supabase.table("saved_recipes").select("*").eq("user_id", current_user.id).eq("recipe_id", recipe_id).execute()
        
        if existing.data:
            # Unsave
            supabase.table("saved_recipes").delete().eq("id", existing.data[0]["id"]).execute()
            return {"message": "Recipe unsaved", "saved": False, "action": "unsaved"}
        else:
            # Save
            result = supabase.table("saved_recipes").insert({
                "user_id": current_user.id,
                "recipe_id": recipe_id
            }).execute()
            return {"message": "Recipe saved", "saved": True, "action": "saved"}
            
    except Exception as e:
        print(f"Save recipe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/save-status/{recipe_id}")
async def get_save_status(recipe_id: str, current_user = Depends(get_current_user)):
    try:
        result = supabase.table("saved_recipes").select("*").eq("user_id", current_user.id).eq("recipe_id", recipe_id).execute()
        return {"saved": len(result.data) > 0}
    except Exception as e:
        return {"saved": False}

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