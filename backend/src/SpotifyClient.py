from dotenv import load_dotenv
import os, base64, requests

load_dotenv()

SPOTIFY_GRANT_TYPE = "client_credentials"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_CLIENT_ID = os.getenv("SPOT_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOT_CLIENT_SEC")

# Special username for Spotify service token
SPOTIFY_SERVICE_USER = "_spotify_service_arox"

# Handling spotify authentication
auth_header = base64.b64encode(
    f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()
).decode()


class SpotifyClient:
    def __init__(self, access_cache):
        self.base_url = "https://api.spotify.com/v1"
        self.headers = {
            "Authorization": f"Bearer ",
            "Content-Type": "application/json",
        }
        self.access_cache = access_cache

    def get_token(self):
        """Get a valid service token, either from cache or fetch a new one"""
        token = self.access_cache.get(SPOTIFY_SERVICE_USER)
        if token is None:
            token = self._fetch_new_spotify_token()
            if token:
                # Cache the token with an expiration time (e.g., 3540 seconds) 3540 for safety
                self.access_cache.set(SPOTIFY_SERVICE_USER, token, ex=3540)
        return token

    def _fetch_new_spotify_token(self):
        """Fetch a fresh service token from Spotify API"""
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {"grant_type": SPOTIFY_GRANT_TYPE}
        try:
            response = requests.post(SPOTIFY_TOKEN_URL, headers=headers, data=data)
            if response.status_code == 200:
                return response.json().get("access_token")
        except Exception as e:
            print(f"Error fetching Spotify token: {e}")
        return None

    def fetch_user_profile(self, user_access_token):
        """Fetch user profile using their access token"""
        headers = {
            "Authorization": f"Bearer {user_access_token}",
            "Content-Type": "application/json",
        }
        try:
            response = requests.get(f"{self.base_url}/me", headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(
                    f"Error fetching profile: {response.status_code} - {response.text}"
                )
        except Exception as e:
            print(f"Error fetching profile: {e}")
        return None

    def fetch_top_tracks(self, user_access_token, time_range="short_term", limit=10):
        """Fetch user's top tracks"""
        headers = {
            "Authorization": f"Bearer {user_access_token}",
            "Content-Type": "application/json",
        }
        params = {"time_range": time_range, "limit": limit}
        try:
            response = requests.get(
                f"{self.base_url}/me/top/tracks", headers=headers, params=params
            )
            if response.status_code == 200:
                return response.json()
            else:
                print(
                    f"Error fetching top tracks: {response.status_code} - {response.text}"
                )
        except Exception as e:
            print(f"Error fetching top tracks: {e}")
        return None

    def fetch_top_artists(self, user_access_token, time_range="short_term", limit=10):
        """Fetch user's top artists"""
        headers = {
            "Authorization": f"Bearer {user_access_token}",
            "Content-Type": "application/json",
        }
        params = {"time_range": time_range, "limit": limit}
        try:
            response = requests.get(
                f"{self.base_url}/me/top/artists", headers=headers, params=params
            )
            if response.status_code == 200:
                return response.json()
            else:
                print(
                    f"Error fetching top artists: {response.status_code} - {response.text}"
                )
        except Exception as e:
            print(f"Error fetching top artists: {e}")
        return None

    def fetch_recently_played(self, user_access_token, limit=20):
        """Fetch user's recently played tracks"""
        headers = {
            "Authorization": f"Bearer {user_access_token}",
            "Content-Type": "application/json",
        }
        params = {"limit": limit}
        try:
            response = requests.get(
                f"{self.base_url}/me/player/recently-played",
                headers=headers,
                params=params,
            )
            if response.status_code == 200:
                return response.json()
            else:
                print(
                    f"Error fetching recently played: {response.status_code} - {response.text}"
                )
        except Exception as e:
            print(f"Error fetching recently played: {e}")
        return None

    def search_tracks(self, query, limit=20):
        """Search for tracks using service token (no user auth needed)"""
        token = self.get_token()
        if token:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
            params = {"q": query, "type": "track", "limit": limit}
            try:
                response = requests.get(
                    f"{self.base_url}/search", headers=headers, params=params
                )
                if response.status_code == 200:
                    return response.json()
            except Exception as e:
                print(f"Error searching tracks: {e}")
        return None
