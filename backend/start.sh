#!/bin/bash

# Activate virtual environment
pip install -r requirements.txt > installation_logs.txt 2>&1
source venv/bin/activate

# Function to handle cleanup
cleanup() {
    echo "Stopping server and deactivating virtual environment..."
    deactivate
    exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Start the Python server
python main.py

# This line will only be reached if the server exits normally
cleanup