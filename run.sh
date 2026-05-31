#!/bin/bash

# ==========================================================================
# Startup Script: AI literature Review & Generic Synthesis Portal
# Runs FastAPI backend on port 8000 and HTTP server on port 3000
# ==========================================================================

# Text styling
GREEN='\033[0;32m'
TEAL='\033[0;36m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${TEAL}"
echo "=========================================================================="
echo "    SynGen: AI Literature Review & Generic Drug Synthesis Portal"
echo "=========================================================================="
echo -e "${NC}"

# Check for uv package manager
UV_PATH="$HOME/.local/bin/uv"
if [ ! -f "$UV_PATH" ]; then
    echo -e "${YELLOW}Warning: uv was not found at $UV_PATH. Falling back to global pip.${NC}"
    PIP_CMD="python3 -m pip"
    VENV_CMD="python3 -m venv"
else
    echo -e "${GREEN}Found uv package manager at $UV_PATH.${NC}"
    PIP_CMD="$UV_PATH pip"
    VENV_CMD="$UV_PATH venv"
fi

# Create Virtual Environment if not exists
if [ ! -d ".venv" ]; then
    echo -e "Initializing virtual environment..."
    $VENV_CMD .venv
fi

# Activate Venv
source .venv/bin/activate

# Install Dependencies
echo -e "Installing backend requirements..."
$PIP_CMD install -r backend/requirements.txt

# Background Process Tracker
BACKEND_PID=""
FRONTEND_PID=""

# Cleanup function on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping development servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Bind cleanup
trap cleanup SIGINT SIGTERM EXIT

# Start FastAPI Backend
echo -e "\nStarting ${PURPLE}FastAPI Backend${NC} on port 8000..."
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to boot
sleep 2

# Start Python HTTP static server for Frontend
echo -e "Starting ${GREEN}HTML5 Frontend${NC} on port 3000..."
cd frontend
python3 -m http.server 3000 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✔ Web Application is successfully running!${NC}"
echo -e "--------------------------------------------------------"
echo -e "Frontend Portal:   ${TEAL}http://localhost:3000${NC}"
echo -e "Backend OpenAPI:   ${PURPLE}http://localhost:8000/docs${NC}"
echo -e "--------------------------------------------------------"
echo -e "${YELLOW}Press [Ctrl+C] to stop both development servers.${NC}\n"

# Keep script running and tail logs
tail -f backend.log
