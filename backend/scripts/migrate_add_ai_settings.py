"""
新增 AI 設定表的資料庫遷移腳本
"""
import sys
from pathlib import Path

# 加入專案根目錄到 Python 路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models.database import Base, engine, SessionLocal, AISettings


def migrate():
    """執行遷移：新增 AI 設定表"""
    print("開始遷移：新增 AI 設定表...")
    
    # 創建所有表（如果表已存在會跳過，只新增不存在的表）
    Base.metadata.create_all(bind=engine)
    
    print("[OK] AI 設定表已創建")
    
    # 檢查是否已有設定記錄，如果沒有則創建預設記錄
    db = SessionLocal()
    try:
        existing_settings = db.query(AISettings).first()
        if not existing_settings:
            default_settings = AISettings(
                provider="gemini",
                openai_model="gpt-4o-mini",
                gemini_model="gemini-1.5-flash",
                ollama_base_url="http://localhost:11434",
                ollama_model="llama3.1:8b"
            )
            db.add(default_settings)
            db.commit()
            print("[OK] 已創建預設 AI 設定記錄")
        else:
            print("[OK] AI 設定記錄已存在，跳過創建")
    except Exception as e:
        print(f"[ERROR] 創建預設設定時發生錯誤: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("遷移完成！")


if __name__ == "__main__":
    migrate()

