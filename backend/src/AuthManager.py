import os
import requests
from urllib.parse import urlencode
from dotenv import load_dotenv
import secrets

load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv("SPOT_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOT_CLIENT_SEC")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8080/auth/callback")
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"

# Scopes needed for user data
SCOPES = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-read-recently-played",
    "playlist-read-private",
    "user-library-read",
    "playlist-modify-private",
]


class AuthManager:
    def __init__(self, cache):
        self.cache = cache

    def get_authorization_url(self):
        """Generate Spotify authorization URL"""
        params = {
            "client_id": SPOTIFY_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": REDIRECT_URI,
            "scope": " ".join(SCOPES),
            "show_dialog": "true",  # Changed to "true" to force login dialog
        }
        return f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"

    def exchange_code_for_tokens(self, code):
        """Exchange authorization code for access and refresh tokens"""
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "client_id": SPOTIFY_CLIENT_ID,
            "client_secret": SPOTIFY_CLIENT_SECRET,
        }

        try:
            response = requests.post(SPOTIFY_TOKEN_URL, data=data)
            if response.status_code == 200:
                return response.json()
            else:
                print(
                    f"Error exchanging code: {response.status_code} - {response.text}"
                )
                return None
        except Exception as e:
            print(f"Error exchanging code: {e}")
            return None

    def refresh_user_token(self, user_id):
        """Refresh a user's access token using their refresh token"""
        refresh_token = self.cache.get(f"user:{user_id}:refresh_token")
        if not refresh_token:
            return None

        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": SPOTIFY_CLIENT_ID,
            "client_secret": SPOTIFY_CLIENT_SECRET,
        }

        try:
            response = requests.post(SPOTIFY_TOKEN_URL, data=data)
            if response.status_code == 200:
                tokens = response.json()
                # Store new access token
                self.cache.set(
                    f"user:{user_id}:access_token", tokens["access_token"], ex=3540
                )
                return tokens
            else:
                print(
                    f"Error refreshing token: {response.status_code} - {response.text}"
                )
                return None
        except Exception as e:
            print(f"Error refreshing token: {e}")
            return None

    def store_user_tokens(self, user_id, tokens):
        """Store user's access and refresh tokens in cache"""
        # Store access token (expires in ~1 hour)
        self.cache.set(f"user:{user_id}:access_token", tokens["access_token"], ex=3540)
        # Store refresh token (doesn't expire, but store for 30 days for cleanup)
        self.cache.set(
            f"user:{user_id}:refresh_token", tokens["refresh_token"], ex=2592000
        )
        # Also map the access token to user_id for verification
        self.cache.set(f"token:{tokens['access_token']}", user_id, ex=3540)

    def get_user_access_token(self, user_id):
        """Get user's current access token, refresh if needed"""
        access_token = self.cache.get(f"user:{user_id}:access_token")
        if access_token:
            return access_token

        # Try to refresh if no valid access token
        tokens = self.refresh_user_token(user_id)
        if tokens:
            return tokens["access_token"]

        return None

    def verify_user_token(self, token):
        """Verify a token and return the associated user_id"""
        user_id = self.cache.get(f"token:{token}")
        return user_id

    def delete_user_tokens(self, user_id):
        """Delete user's tokens from cache (logout)"""
        access_token = self.cache.get(f"user:{user_id}:access_token")
        if access_token:
            self.cache.delete(f"token:{access_token}")
        self.cache.delete(f"user:{user_id}:access_token")
        self.cache.delete(f"user:{user_id}:refresh_token")
