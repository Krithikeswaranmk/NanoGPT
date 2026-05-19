#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# NanoGPT Visualizer — One-Command Startup Script
# Run this from the project root: bash start.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}  ╔══════════════════════════════════════╗"
echo -e "  ║   NanoGPT Visualizer  •  Startup     ║"
echo -e "  ╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. Check .env ─────────────────────────────────────────────────────────────
if [ ! -f backend/.env ]; then
  echo -e "${YELLOW}  ⚠  No backend/.env found — copying from .env.example${NC}"
  cp backend/.env.example backend/.env
  echo -e "${RED}  ✗  Edit backend/.env and add your GROQ_API_KEY, then run again.${NC}"
  echo -e "     Get a free key at: ${CYAN}https://console.groq.com${NC}"
  exit 1
fi

if grep -q "your_groq_api_key_here" backend/.env; then
  echo -e "${RED}  ✗  GROQ_API_KEY is not set in backend/.env${NC}"
  echo -e "     Get a free key at: ${CYAN}https://console.groq.com${NC}"
  echo -e "     Then edit backend/.env and replace 'your_groq_api_key_here'"
  exit 1
fi

echo -e "${GREEN}  ✓  .env found${NC}"

# ── 2. Backend setup ──────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}  Setting up Python backend...${NC}"

cd backend

# Create venv if needed
if [ ! -d "venv" ]; then
  echo "  Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q
echo -e "${GREEN}  ✓  Backend dependencies installed${NC}"

# Load env vars
export $(grep -v '^#' .env | xargs)

# Start backend in background
echo "  Starting FastAPI on http://localhost:8000 ..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "${GREEN}  ✓  Backend started (PID $BACKEND_PID)${NC}"

cd ..

# ── 3. Frontend setup ─────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}  Setting up frontend...${NC}"

cd frontend

if [ ! -d "node_modules" ]; then
  echo "  Installing npm packages..."
  npm install -q
fi
echo -e "${GREEN}  ✓  Frontend dependencies installed${NC}"

# ── 4. Open browser after delay ───────────────────────────────────────────────
(sleep 4 && open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null || true) &

# ── 5. Start frontend ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}  ══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀  NanoGPT Visualizer is starting!${NC}"
echo -e "${GREEN}  ══════════════════════════════════════════════${NC}"
echo ""
echo -e "  Frontend: ${CYAN}http://localhost:3000${NC}"
echo -e "  Backend:  ${CYAN}http://localhost:8000${NC}"
echo -e "  API docs: ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop both servers."
echo ""

npm run dev

# ── Cleanup on exit ────────────────────────────────────────────────────────────
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID 2>/dev/null; exit 0" INT TERM
wait
