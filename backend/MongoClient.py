from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os
import certifi
from urllib.parse import quote_plus
from datetime import datetime, timedelta

load_dotenv()

DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_URI = os.getenv("DB_URI")


class MongoDBClient:
    def __init__(self):
        encoded_user = quote_plus(DB_USER)
        encoded_pass = quote_plus(DB_PASS)

        self.uri = f"mongodb+srv://{encoded_user}:{encoded_pass}@{DB_URI}"

        self.client = MongoClient(
            self.uri, tlsCAFile=certifi.where(), server_api=ServerApi("1")
        )
        self.db = self.client[DB_NAME]
        self.user_session = self.db["user_session"]

    def _get_time_now_utc(self):
        return datetime.now(datetime.timezone.utc)

    def create_session(self, username, session_key, ttl_minutes=56):
        """
        Create a new session for a user

        Args:
            username: The username
            session_key: Unique session key/token
            ttl_hours: Time to live in hours (default 24)

        Returns:
            The inserted document ID or None if failed
        """
        try:
            expires_at = self._get_time_now_utc() + timedelta(minutes=ttl_minutes)

            session_doc = {
                "username": username,
                "session_key": session_key,
                "created_at": self._get_time_now_utc(),
                "expires_at": expires_at,
            }

            result = self.user_session.insert_one(session_doc)
            return result.inserted_id
        except Exception as e:
            print(f"Error creating session: {e}")
            return None

    def get_session(self, session_key):
        """
        Retrieve a session by session key

        Args:
            session_key: The session key to lookup

        Returns:
            Session document or None if not found/expired
        """
        try:
            session = self.user_session.find_one({"session_key": session_key})

            # Check if session exists and hasn't expired
            if session and session.get("expires_at") < self._get_time_now_utc():
                return session
            return None
        except Exception as e:
            print(f"Error getting session: {e}")
            return None

    def delete_session(self, session_key):
        """
        Delete a session (logout)

        Args:
            session_key: The session key to delete

        Returns:
            True if deleted, False otherwise
        """
        try:
            result = self.user_session.delete_one({"session_key": session_key})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False

    def delete_user_sessions(self, username):
        """
        Delete all sessions for a user (logout everywhere)

        Args:
            username: The username

        Returns:
            Number of sessions deleted
        """
        try:
            result = self.user_session.delete_many({"username": username})
            return result.deleted_count
        except Exception as e:
            print(f"Error deleting user sessions: {e}")
            return 0

    def refresh_session(self, session_key, ttl_minutes=56):
        """
        Extend the expiration time of a session

        Args:
            session_key: The session key to refresh
            ttl_hours: New TTL in hours from now

        Returns:
            True if refreshed, False otherwise
        """
        try:
            new_expires_at = self._get_time_now_utc() + timedelta(minutes=ttl_minutes)

            result = self.user_session.update_one(
                {"session_key": session_key}, {"$set": {"expires_at": new_expires_at}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error refreshing session: {e}")
            return False

    def health_check(self):
        try:
            self.client.admin.command("ping")
            return True, "Spotifly DB"
        except Exception as e:
            return False, str(e)
