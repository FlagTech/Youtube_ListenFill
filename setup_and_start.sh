#!/usr/bin/env bash
# YouTube 聽打練習 - macOS/Linux Launcher

# Lock working directory to script location
cd "$(dirname "$0")" || exit 1

FRONTEND_URL="http://localhost:5173"
BACKEND_PORT=8000

echo "===================================="
echo "  YouTube 聽打練習 - Launcher"
echo "===================================="
echo ""
echo "[Info] Current directory: $(pwd)"
echo ""

# ---------- Check prerequisites ----------
echo "[CHECK] Python..."
if ! command -v python3 &>/dev/null; then
  echo "[ERROR] Python not found. Please install Python 3.11+."
  echo "        https://www.python.org/downloads/"
  exit 1
fi
PYVER=$(python3 --version)
echo "[OK] $PYVER"
echo ""

echo "[CHECK] Node.js..."
if ! command -v node &>/dev/null; then
  echo "[ERROR] Node.js not found. Please install Node.js 20.19+."
  echo "        https://nodejs.org/"
  exit 1
fi
NODEVER=$(node --version)
echo "[OK] Node $NODEVER"
echo ""

echo "[CHECK] uv..."
if ! command -v uv &>/dev/null; then
  echo "[WARN] uv not found in PATH."
  echo ""
  read -r -p "Install uv now? (Y/N): " INSTALL_UV
  if [[ ! "$INSTALL_UV" =~ ^[Yy]$ ]]; then
    echo "[ERROR] uv is required. Please install uv and run this launcher again."
    exit 1
  fi
  echo ""
  echo "[SETUP] Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  # Add uv to PATH for this session
  export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
  if ! command -v uv &>/dev/null; then
    echo "[ERROR] uv was installed, but is not available in this session."
    echo "        Please open a new terminal and run setup_and_start.sh again."
    exit 1
  fi
fi
UVVER=$(uv --version)
echo "[OK] $UVVER"
echo ""

# ---------- Backend deps ----------
echo "[SETUP] Backend (uv sync)..."
if ! (cd backend && uv sync); then
  echo "[ERROR] uv sync failed."
  exit 1
fi
echo "[OK] Backend deps ready."
echo ""

# ---------- Frontend deps ----------
echo "[SETUP] Frontend deps..."
if [ ! -f "frontend/package.json" ]; then
  echo "[ERROR] Missing frontend/package.json"
  exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "[INFO] Installing npm packages (frontend)..."
  if ! (cd frontend && npm install); then
    echo "[ERROR] npm install failed (frontend)"
    exit 1
  fi
  echo "[OK] Frontend deps installed."
else
  echo "[OK] Frontend node_modules present."
fi
echo ""

# ---------- Launch backend ----------
echo "[START] Launching Backend..."
osascript -e "tell application \"Terminal\"
  do script \"cd '$(pwd)/backend' && export PATH=\\\"\$HOME/.local/bin:\$HOME/.cargo/bin:\$PATH\\\" && uv run python app.py; exec bash\"
  set custom title of front window to \"YouTube 聽打練習 - Backend\"
end tell"

# Wait for backend to start
sleep 3

# ---------- Launch frontend ----------
echo "[START] Launching Frontend (Vite)..."
osascript -e "tell application \"Terminal\"
  do script \"cd '$(pwd)/frontend' && npm run dev; exec bash\"
  set custom title of front window to \"YouTube 聽打練習 - Frontend\"
end tell"

# Wait for frontend to start
sleep 4

# ---------- Open browser ----------
echo "[START] Opening browser..."
open "$FRONTEND_URL"

echo ""
echo "===================================="
echo "  Services are now running!"
echo "===================================="
echo ""
echo "[Info] Frontend: $FRONTEND_URL"
echo "[Info] Backend : http://localhost:$BACKEND_PORT"
echo "[Info] API Docs: http://localhost:$BACKEND_PORT/docs"
echo ""
echo "Close the Terminal windows to stop the services."
