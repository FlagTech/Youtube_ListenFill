"""
FastAPI 主應用程式
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.models.database import init_db, BASE_DIR
from app.api.routes import router
import os
import traceback
from pathlib import Path

# 建立 FastAPI 應用
app = FastAPI(
    title="YouTube 聽打練習 API",
    description="提供 YouTube 影片下載、字幕處理和聽打練習功能",
    version="1.0.0"
)

# 全局異常處理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_detail = traceback.format_exc()
    print(f"[ERROR] 全局異常處理器捕獲錯誤:")
    print(error_detail)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc), "traceback": error_detail}
    )

# 請求日誌中間件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[REQUEST] {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        print(f"[RESPONSE] {response.status_code}")
        return response
    except Exception as e:
        print(f"[ERROR] 請求處理失敗: {e}")
        traceback.print_exc()
        raise

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊路由
app.include_router(router)

# 初始化資料庫
@app.on_event("startup")
async def startup_event():
    """應用啟動時初始化資料庫"""
    # 確保下載目錄存在
    downloads_dir = BASE_DIR / "downloads"
    (downloads_dir / "videos").mkdir(parents=True, exist_ok=True)
    (downloads_dir / "subtitles").mkdir(parents=True, exist_ok=True)
    
    init_db()
    print("[OK] 資料庫初始化完成")
    print(f"[OK] 下載目錄: {downloads_dir}")

# 根路由
@app.get("/")
async def root():
    """API 根路由"""
    return {
        "message": "YouTube 聽打練習 API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# 健康檢查
@app.get("/health")
async def health_check():
    """健康檢查端點"""
    return {"status": "healthy"}

