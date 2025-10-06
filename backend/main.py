from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os, base64, requests
from MongoClient import MongoDBClient as Mongo

import heapq


load_dotenv()

SPOTIFY_GRANT_TYPE = "client_credentials"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_CLIENT_ID = os.getenv("SPOT_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOT_CLIENT_SEC")

# Handling spotify authentication
auth_header = base64.b64encode(
    f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()
).decode()


def get_spotify_token():
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    data = {"grant_type": SPOTIFY_GRANT_TYPE}

    response = requests.post(SPOTIFY_TOKEN_URL, headers=headers, data=data)
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


# App setup
app = FastAPI()

# MongoDb Client setup
mongo_client = Mongo()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "*",
    ],  # Next.js frontend and all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello from Python backend!"}


@app.get("/retrieve-token")
async def retrieve_token():
    token = get_spotify_token()
    if token:
        return {"access_token": token}
    return {"error": "Failed to retrieve token"}


@app.get("/health")
async def health_check():
    if not mongo_client.health_check():
        return {"status": "error", "message": "Database connection failed"}
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)
