@echo off
chcp 65001 >nul
cls
echo ===================================
echo  YouTube Practice - Quick Start
echo ===================================
echo.

cd /d %~dp0

echo [1/4] Checking backend dependencies...
cd backend
if not exist .venv (
    echo Installing backend dependencies...
    uv sync
) else (
    echo Backend dependencies OK
)
cd ..
echo.

echo [2/4] Checking frontend dependencies...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
) else (
    echo Frontend dependencies OK
)
cd ..
echo.

echo [3/4] Starting backend server...
cd backend
start "Backend-Server" cmd /k "uv run python app.py"
cd ..
echo.

echo [4/4] Starting frontend server...
timeout /t 3 /nobreak >nul
cd frontend
start "Frontend-Server" cmd /k "npm run dev"
cd ..

echo.
echo ===================================
echo  Setup Complete!
echo ===================================
echo.
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
echo This window will close in 3 seconds...
timeout /t 3 /nobreak >nul
exit
