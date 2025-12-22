"""
資料庫模型定義
"""
import os
from datetime import datetime
from pathlib import Path
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

Base = declarative_base()


class Folder(Base):
    """分類資料夾表"""
    __tablename__ = "folders"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#6366f1")  # 預設顏色（Indigo）
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 關聯
    videos = relationship("Video", back_populates="folder")


class Video(Base):
    """影片資訊表"""
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    youtube_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    channel = Column(String)
    duration = Column(Integer)  # 秒數
    thumbnail_url = Column(String)
    video_path = Column(String)  # 本地檔案路徑
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)  # 分類資料夾 ID（可為空表示未分類）
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 關聯
    folder = relationship("Folder", back_populates="videos")
    segments = relationship("SubtitleSegment", back_populates="video", cascade="all, delete-orphan")


class SubtitleSegment(Base):
    """字幕分段表"""
    __tablename__ = "subtitle_segments"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    index = Column(Integer, nullable=False)  # 段落索引
    start_time = Column(Float, nullable=False)  # 開始時間（秒）
    end_time = Column(Float, nullable=False)  # 結束時間（秒）
    text_en = Column(Text, nullable=False)  # 英文原文
    text_zh = Column(Text)  # 繁體中文翻譯
    letter_template = Column(Text)  # 字母模板（用於生成輸入框）
    ai_insights = Column(Text, nullable=True)  # AI 解說內容

    # 關聯
    video = relationship("Video", back_populates="segments")


class AISettings(Base):
    """AI 設定表（單一使用者模式）"""
    __tablename__ = "ai_settings"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, default="gemini")  # 'openai', 'gemini', 'ollama'
    openai_api_key = Column(String, nullable=True)
    openai_model = Column(String, default="gpt-5-mini")
    gemini_api_key = Column(String, nullable=True)
    gemini_model = Column(String, default="gemini-2.5-flash")
    ollama_base_url = Column(String, default="http://localhost:11434")
    ollama_model = Column(String, default="llama3.1:8b")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# 資料庫設定
# 取得專案根目錄的絕對路徑
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "database.db"

# 確保資料庫目錄存在
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """初始化資料庫"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """取得資料庫連線"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

