#!/bin/bash

# If log file exists, remove it
[ -f installation_log.txt ] && rm installation_log.txt

# Create virtual environment if it doesn't exist
[ ! -d venv ] && python3 -m venv venv
pip install -r requirements.txt > installation_log.txt 2>&1

# Activate virtual environment
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