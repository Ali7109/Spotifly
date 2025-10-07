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
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        self.access_cache = access_cache

    def get_token(self):
        """Get a valid token, either from cache or fetch a new one"""
        token = self._fetch_new_spotify_token()
        return token
        # token = self.access_cache.get(SPOTIFY_SERVICE_USER)
        # if not token:
        #     token = self._fetch_new_spotify_token()
        #     if token:
        #         # Cache the token with an expiration time (e.g., 3540 seconds) 3540 for safety
        #         self.access_cache.set(SPOTIFY_SERVICE_USER, token, ex=3540)
        # return token

    def _fetch_new_spotify_token(self):
        """Fetch a fresh token from Spotify API"""
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
