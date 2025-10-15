from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
import uvicorn
from src.RedisCache import RedisCache
from src.SpotifyClient import SpotifyClient
from src.AuthManager import AuthManager

# App setup
app = FastAPI()
access_cache = RedisCache()
spotify_client = SpotifyClient(access_cache)
auth_manager = AuthManager(access_cache)

# Security scheme
security = HTTPBearer()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to verify user token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    user_id = auth_manager.verify_user_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )
    return user_id


@app.get("/auth/login")
async def login():
    """Redirect user to Spotify authorization page"""
    auth_url = auth_manager.get_authorization_url()
    return {"auth_url": auth_url}


# Handle logout
@app.get("/auth/logout")
async def logout(user_id: str = Depends(get_current_user)):
    """Logout user by deleting their tokens"""
    auth_manager.delete_user_tokens(user_id)
    return {"detail": "Logged out successfully"}


@app.get("/auth/callback")
async def callback(code: str):
    """Handle Spotify callback and exchange code for tokens"""
    import json
    import urllib.parse

    tokens = auth_manager.exchange_code_for_tokens(code)
    if not tokens:
        # Redirect to frontend with error
        return RedirectResponse(url="http://localhost:3000?error=auth_failed")

    # Get user profile to identify the user
    profile = spotify_client.fetch_user_profile(tokens["access_token"])
    if not profile:
        return RedirectResponse(url="http://localhost:3000?error=profile_failed")

    user_id = profile["id"]

    # Store tokens for this user
    auth_manager.store_user_tokens(user_id, tokens)

    # Redirect to frontend callback with tokens (use json.dumps for proper JSON)
    user_json = urllib.parse.quote(json.dumps(profile))
    redirect_url = f"http://localhost:3000/callback?access_token={tokens['access_token']}&refresh_token={tokens['refresh_token']}&user={user_json}"
    return RedirectResponse(url=redirect_url)


@app.get("/spotify/profile")
async def get_spotify_profile(user_id: str = Depends(get_current_user)):
    """Get current user's Spotify profile (requires authentication)"""
    # Get user's access token
    user_token = auth_manager.get_user_access_token(user_id)
    if not user_token:
        raise HTTPException(status_code=401, detail="No valid token found")

    profile = spotify_client.fetch_user_profile(user_token)
    if profile:
        return profile
    raise HTTPException(status_code=500, detail="Unable to fetch Spotify profile")


@app.get("/auth/refresh")
async def refresh_token(user_id: str = Depends(get_current_user)):
    """Refresh user's access token"""
    new_tokens = auth_manager.refresh_user_token(user_id)
    if not new_tokens:
        raise HTTPException(status_code=401, detail="Failed to refresh token")
    return {"access_token": new_tokens["access_token"]}


@app.get("/spotify/top-tracks")
async def get_top_tracks(
    user_id: str = Depends(get_current_user),
    time_range: str = "short_term",
    limit: int = 10,
):
    """Get user's top tracks (time_range: short_term, medium_term, long_term)"""
    user_token = auth_manager.get_user_access_token(user_id)
    if not user_token:
        raise HTTPException(status_code=401, detail="No valid token found")

    tracks = spotify_client.fetch_top_tracks(user_token, time_range, limit)
    if tracks:
        return tracks
    raise HTTPException(status_code=500, detail="Unable to fetch top tracks")


@app.get("/spotify/top-artists")
async def get_top_artists(
    user_id: str = Depends(get_current_user),
    time_range: str = "short_term",
    limit: int = 10,
):
    """Get user's top artists (time_range: short_term, medium_term, long_term)"""
    user_token = auth_manager.get_user_access_token(user_id)
    if not user_token:
        raise HTTPException(status_code=401, detail="No valid token found")

    artists = spotify_client.fetch_top_artists(user_token, time_range, limit)
    if artists:
        return artists
    raise HTTPException(status_code=500, detail="Unable to fetch top artists")


@app.get("/spotify/recently-played")
async def get_recently_played(
    user_id: str = Depends(get_current_user), limit: int = 20
):
    """Get user's recently played tracks"""
    user_token = auth_manager.get_user_access_token(user_id)
    if not user_token:
        raise HTTPException(status_code=401, detail="No valid token found")

    tracks = spotify_client.fetch_recently_played(user_token, limit)
    if tracks:
        return tracks
    raise HTTPException(
        status_code=500, detail="Unable to fetch recently played tracks"
    )


@app.get("/auth/me")
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """Get current authenticated user ID"""
    return {"user_id": user_id}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)
