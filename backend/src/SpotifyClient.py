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

    """
    Example usage:
    spotify_client = SpotifyClient(access_cache)
    results = spotify_client.search_tracks("Imagine Dragons", limit=5)
    """

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

    # Get playlists
    def fetch_user_playlists(self, user_access_token, limit=20):
        """Fetch user's playlists"""
        headers = {
            "Authorization": f"Bearer {user_access_token}",
            "Content-Type": "application/json",
        }
        params = {"limit": limit}
        try:
            response = requests.get(
                f"{self.base_url}/me/playlists", headers=headers, params=params
            )
            if response.status_code == 200:
                return response.json()
            else:
                print(
                    f"Error fetching playlists: {response.status_code} - {response.text}"
                )
        except Exception as e:
            print(f"Error fetching playlists: {e}")
        return None

    def fetch_playlist_tracks(self, user_access_token, playlist_id, limit=100):
        """Fetch tracks in a specific playlist"""
        headers = {
            "Authorization": f"Bearer {user_access_token}",
            "Content-Type": "application/json",
        }
        params = {"limit": limit}
        try:
            response = requests.get(
                f"{self.base_url}/playlists/{playlist_id}/tracks",
                headers=headers,
                params=params,
            )
            if response.status_code == 200:
                items = response.json().get("items", [])
                track_uris = [
                    item["track"]["uri"] for item in items if item.get("track")
                ]
                return track_uris
            else:
                print(
                    f"Error fetching playlist tracks: {response.status_code} - {response.text}"
                )
        except Exception as e:
            print(f"Error fetching playlist tracks: {e}")
        return None

    # Add track to playlist called playlist_name, create if doesn't exist. If track exists, do nothing
    def add_track_to_playlist(self, user_access_token, playlist_name, track_uri):
        """Add a track to a user's playlist, creating the playlist if it doesn't exist"""
        headers = {
            "Authorization": f"Bearer {user_access_token}",
            "Content-Type": "application/json",
        }

        # Step 1: Check if the playlist exists
        params = {"limit": 50}  # Fetch up to 50 playlists
        try:
            response = requests.get(
                f"{self.base_url}/me/playlists", headers=headers, params=params
            )
            if response.status_code == 200:
                playlists = response.json().get("items", [])
                playlist_id = None
                for playlist in playlists:
                    if playlist["name"] == playlist_name:
                        playlist_id = playlist["id"]
                        break

                # Step 2: If the playlist doesn't exist, create it
                if not playlist_id:
                    user_profile = self.fetch_user_profile(user_access_token)
                    if not user_profile:
                        print("Error fetching user profile to create playlist")
                        return False
                    user_id = user_profile["id"]
                    create_payload = {
                        "name": playlist_name,
                        "description": "Playlist created via API",
                        "public": False,
                    }
                    create_response = requests.post(
                        f"{self.base_url}/users/{user_id}/playlists",
                        headers=headers,
                        json=create_payload,
                    )
                    if create_response.status_code == 201:
                        playlist_id = create_response.json().get("id")
                    else:
                        print(
                            f"Error creating playlist: {create_response.status_code} - {create_response.text}"
                        )
                        return False

                # Step 3: Add the track to the playlist

                # Step 3.5: Make sure track is not already in playlist
                existing_tracks = self.fetch_playlist_tracks(
                    user_access_token, playlist_id
                )
                if existing_tracks and track_uri in existing_tracks:
                    print("Track is already in the playlist")
                    return True

                add_payload = {"uris": [track_uri]}
                add_response = requests.post(
                    f"{self.base_url}/playlists/{playlist_id}/tracks",
                    headers=headers,
                    json=add_payload,
                )
                if add_response.status_code == 201:
                    return True
                else:
                    print(
                        f"Error adding track to playlist: {add_response.status_code} - {add_response.text}"
                    )
            else:
                print(
                    f"Error fetching playlists: {response.status_code} - {response.text}"
                )
        except Exception as e:
            print(f"Error adding track to playlist: {e}")
        return False
