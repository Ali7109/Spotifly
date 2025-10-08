import time
import pytest
from SpotifyClient import SpotifyClient


@pytest.fixture(scope="module")
def spotify_client():
    # Mock access cache with a simple dictionary
    class MockCache:
        def __init__(self):
            self.store = {}

        def get(self, key):
            return self.store.get(key)

        def set(self, key, value, ex=None):
            self.store[key] = value

    access_cache = MockCache()
    client = SpotifyClient(access_cache)
    return client


def test_get_token(spotify_client):
    token = spotify_client.get_token()
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0

    # this doesnt get printed
    print(f"Fetched Spotify token: {token[:10]}...")  # Print first 10 chars for brevity
