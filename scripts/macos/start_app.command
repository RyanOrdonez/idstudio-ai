#!/bin/bash

echo "========================================"
echo "IDStudio.ai - One-Click Launcher"
echo "========================================"
echo

# Get the directory of this script and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 18.17 or later from https://nodejs.org/"
    echo
    read -p "Press any key to exit..."
    exit 1
fi

# Display Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Check if .env.local exists, if not copy from .env.example
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo "Copying .env.example to .env.local..."
        cp ".env.example" ".env.local"
        echo
        echo "IMPORTANT: Please edit .env.local and add your Supabase credentials"
        echo "Get them from: https://supabase.com/dashboard"
        echo
        read -p "Press any key after you've updated .env.local with your credentials..."
    else
        echo "WARNING: No .env.example file found"
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        read -p "Press any key to exit..."
        exit 1
    fi
    echo "Dependencies installed successfully!"
    echo
fi

# Start the development server in background
echo "Starting IDStudio.ai development server..."
echo
npm run dev &
SERVER_PID=$!

# Wait for the server to be ready
echo "Waiting for server to start..."
sleep 3

# Check if port 3000 is responding
while ! curl -s http://localhost:3000 > /dev/null 2>&1; do
    sleep 2
    echo "Still waiting for server..."
done

# Open browser
echo "Server is ready! Opening browser..."
open "http://localhost:3000"

echo
echo "========================================"
echo "IDStudio.ai is now running!"
echo "URL: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo

# Wait for the background process and show output
wait $SERVER_PID
