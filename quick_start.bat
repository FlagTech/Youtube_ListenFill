@echo off
chcp 65001 >nul
echo ===================================
echo  YouTube 聽打練習 - 全部啟動
echo ===================================
echo.

echo [1/4] 設定後端依賴...
cd backend
if not exist .venv (
    echo 首次執行：安裝後端 Python 依賴...
    uv sync
) else (
    echo 後端依賴已存在，跳過安裝
)
cd ..
echo.

echo [2/4] 設定前端依賴...
cd frontend
if not exist node_modules (
    echo 首次執行：安裝前端 npm 依賴...
    call npm install
) else (
    echo 前端依賴已存在，跳過安裝
)
cd ..
echo.

echo [3/4] 啟動後端伺服器...
start "YouTube聽打練習-後端" cmd /k "cd backend && uv run app.py"

echo.
echo [4/4] 等待 3 秒後啟動前端...
timeout /t 3 /nobreak >nul

echo.
echo 啟動前端開發伺服器...
start "YouTube聽打練習-前端" cmd /k "cd frontend && npm start"

echo.
echo ===================================
echo  啟動完成！
echo ===================================
echo.
echo 後端 API: http://localhost:8000
echo API 文檔: http://localhost:8000/docs
echo 前端應用: http://localhost:5173 (或 5174)
echo.
echo 啟動完成，此視窗將自動關閉...
timeout /t 2 /nobreak >nul
exit
