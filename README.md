# Next.js + Python Backend Setup

This project consists of a Next.js frontend and a Python FastAPI backend.

## Project Structure

-   `frontend/`: Next.js application with Tailwind CSS
-   `backend/`: Python FastAPI server

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will be available at http://localhost:3000

### Backend Setup

1. Navigate to the backend directory:
    ```bash
    cd backend
    ```
2. Activate the virtual environment:
    ```bash
    source venv/bin/activate
    ```
3. Start the Python server:
    ```bash
    python main.py
    ```
    The backend will be available at http://localhost:8080

## Environment Variables

-   Frontend: `.env.local`
-   Backend: `.env`
