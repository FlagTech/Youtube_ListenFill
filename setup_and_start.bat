@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Lock working directory to script location
cd /d "%~dp0"

set "FRONTEND_URL=http://localhost:5173"
set "BACKEND_PORT=8000"

echo ====================================
echo   YouTube ???? - Launcher
echo ====================================
echo.
echo [Info] Current directory: %CD%
echo.

REM ---------- Check prerequisites ----------
echo [CHECK] Python...
set "PYVER="
where python >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Python not found in PATH. Please install Python 3.11+.
  goto :END
) else (
  for /f "tokens=*" %%i in ('python --version') do set "PYVER=%%i"
)
echo [OK] %PYVER%
echo.

echo [CHECK] Node.js...
set "NODEVER="
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js not found in PATH. Please install Node.js 20.19+.
  goto :END
) else (
  for /f "tokens=*" %%i in ('node --version') do set "NODEVER=%%i"
)
echo [OK] Node %NODEVER%
echo.

echo [CHECK] uv...
set "UVVER="
where uv >nul 2>&1
if %errorlevel% neq 0 (
  echo [WARN] uv not found in PATH.
  echo.
  set /p INSTALL_UV="Install uv now? (Y/N): "
  if /i not "!INSTALL_UV!"=="Y" (
    echo [ERROR] uv is required. Please install uv and run this launcher again.
    goto :END
  )
  echo.
  echo [SETUP] Installing uv...
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  if !errorlevel! neq 0 (
    echo [ERROR] uv installation failed.
    goto :END
  )
  echo [INFO] Refreshing PATH...
  set "PATH=%USERPROFILE%\.local\bin;%USERPROFILE%\.cargo\bin;%PATH%"
  where uv >nul 2>&1
  if !errorlevel! neq 0 (
    echo [ERROR] uv was installed, but it is not available in this window.
    echo         Please close this window and run setup_and_start.bat again.
    goto :END
  )
  for /f "tokens=*" %%i in ('uv --version') do set "UVVER=%%i"
) else (
  for /f "tokens=*" %%i in ('uv --version') do set "UVVER=%%i"
)
echo [OK] uv %UVVER%
echo.

REM ---------- Backend deps ----------
echo [SETUP] Backend (uv sync)...
pushd backend >nul
uv sync
set "UV_ERR=%errorlevel%"
popd >nul
if not "%UV_ERR%"=="0" (
  echo [ERROR] uv sync failed.
  goto :END
)
echo [OK] Backend deps ready.
echo.

REM ---------- Frontend deps ----------
echo [SETUP] Frontend deps...
if not exist "frontend\package.json" (
  echo [ERROR] Missing frontend\package.json
  goto :END
)
if not exist "frontend\node_modules" goto :INSTALL_FE
echo [OK] Frontend node_modules present
echo.
goto :AFTER_FE

:INSTALL_FE
echo [INFO] Installing npm packages (frontend)...
pushd frontend >nul
call npm install
set "NPM_ERR=%errorlevel%"
popd >nul
if not "%NPM_ERR%"=="0" (
  echo [ERROR] npm install failed (frontend)
  goto :END
)
echo [OK] Frontend deps installed
echo.
:AFTER_FE

REM ---------- Launch backend ----------
echo [START] Launching Backend...
start "YouTube ???? - Backend" cmd /k "cd /d "%CD%\backend" && uv run python app.py"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM ---------- Launch frontend ----------
echo [START] Launching Frontend (Vite)...
start "YouTube ???? - Frontend" cmd /k "cd /d "%CD%\frontend" && npm run dev"

REM Wait for frontend to start
timeout /t 4 /nobreak >nul

REM ---------- Open browser ----------
echo [START] Opening browser...
start "" "%FRONTEND_URL%"

echo.
echo ====================================
echo   Services are now running!
echo ====================================
echo.
echo [Info] Frontend: %FRONTEND_URL%
echo [Info] Backend : http://localhost:%BACKEND_PORT%
echo [Info] API Docs: http://localhost:%BACKEND_PORT%/docs
echo.
echo Windows may prompt firewall permission; please allow access.
echo.
echo Launcher window will close automatically.
timeout /t 2 /nobreak >nul
exit /b 0

:END
echo.
echo Press any key to close this window.
pause >nul
exit /b 0
