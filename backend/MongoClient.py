from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

load_dotenv()
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_URI = os.getenv("DB_URI")


class MongoDBClient:
    def __init__(self):
        self.uri = f"mongodb+srv://{DB_USER}:{DB_PASS}@{DB_URI}"
        self.client = MongoClient(self.uri, server_api=ServerApi("1"))
        self.db = self.client[DB_NAME]

    def health_check(self):
        try:
            self.client.admin.command("ping")
            return True
        except Exception as e:
            print(e)
            return False
