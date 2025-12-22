"""
資料庫遷移腳本：新增 Folder 資料表和 Video.folder_id 欄位
"""
import sys
from pathlib import Path

# 添加專案根目錄到 Python 路徑
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from app.models.database import Base, engine, SessionLocal
from sqlalchemy import inspect

def migrate():
    """執行資料庫遷移"""
    print("開始資料庫遷移...")
    
    # 檢查是否需要建立新資料表
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    print(f"現有資料表: {existing_tables}")
    
    # 建立所有資料表（會自動跳過已存在的表）
    Base.metadata.create_all(bind=engine)
    
    # 再次檢查資料表
    inspector = inspect(engine)
    new_tables = inspector.get_table_names()
    
    print(f"遷移後的資料表: {new_tables}")
    
    # 檢查 folders 表是否成功建立
    if 'folders' in new_tables:
        print("✅ folders 資料表已成功建立")
    else:
        print("⚠️ folders 資料表建立失敗")
    
    # 檢查 videos 表的欄位
    videos_columns = [col['name'] for col in inspector.get_columns('videos')]
    print(f"videos 表的欄位: {videos_columns}")
    
    if 'folder_id' in videos_columns:
        print("✅ folder_id 欄位已存在於 videos 表")
    else:
        print("⚠️ folder_id 欄位不存在，可能需要手動添加")
        print("   對於 SQLite，建議備份資料庫後重新建立")
    
    print("\n資料庫遷移完成！")

if __name__ == "__main__":
    migrate()

