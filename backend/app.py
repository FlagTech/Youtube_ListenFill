"""
YouTube 聽打練習 - 後端啟動入口
"""
import uvicorn
import os

if __name__ == "__main__":
    # 設置環境變數
    os.environ.setdefault("PYTHONUNBUFFERED", "1")

    print("=" * 50)
    print("  YouTube 聽打練習 - 後端伺服器")
    print("=" * 50)
    print()
    print("後端 API: http://localhost:8000")
    print("API 文檔: http://localhost:8000/docs")
    print()
    print("按 Ctrl+C 停止伺服器")
    print("=" * 50)
    print()

    # 啟動 uvicorn 伺服器
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
