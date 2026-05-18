"""
API 路由定義
"""
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, AsyncGenerator, Optional
from datetime import datetime
import os
import json
import asyncio
import queue

from app.models.database import get_db, Video, SubtitleSegment, Folder, AISettings
from app.services.youtube_service import youtube_service
from app.services.subtitle_service import subtitle_service
from app.services.ai_service import get_ai_service


router = APIRouter(prefix="/api")


# Pydantic 模型
class VideoDownloadRequest(BaseModel):
    """影片下載請求"""
    url: str


class VideoResponse(BaseModel):
    """影片回應"""
    id: int
    youtube_id: str
    title: str
    channel: str
    duration: int
    thumbnail_url: str
    video_path: str
    folder_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FolderRequest(BaseModel):
    """分類資料夾請求"""
    name: str
    color: str = "#6366f1"


class FolderResponse(BaseModel):
    """分類資料夾回應"""
    id: int
    name: str
    color: str
    created_at: datetime
    video_count: int = 0

    class Config:
        from_attributes = True


class MoveVideoRequest(BaseModel):
    """移動影片請求"""
    folder_id: Optional[int] = None  # None 表示移到未分類


class SubtitleSegmentResponse(BaseModel):
    """字幕分段回應"""
    id: int
    video_id: int
    index: int
    start_time: float
    end_time: float
    text_en: str
    text_zh: str
    letter_template: str
    ai_insights: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/videos/download/stream")
async def download_video_stream(request: VideoDownloadRequest, db: Session = Depends(get_db)):
    """
    使用 SSE 串流下載 YouTube 影片和字幕，並即時回報進度

    Args:
        request: 包含 YouTube URL 的請求
        db: 資料庫連線

    Returns:
        SSE 串流回應
    """
    async def generate_progress() -> AsyncGenerator[str, None]:
        try:
            # 1. 取得影片資訊
            yield f"data: {json.dumps({'stage': 'info', 'progress': 10, 'message': '正在取得影片資訊...'})}\n\n"
            await asyncio.sleep(0.1)

            info = youtube_service.get_video_info(request.url)
            youtube_id = info['youtube_id']

            # 檢查是否已下載
            existing_video = db.query(Video).filter(Video.youtube_id == youtube_id).first()
            if existing_video:
                video_data = {
                    'id': existing_video.id,
                    'youtube_id': existing_video.youtube_id,
                    'title': existing_video.title,
                    'channel': existing_video.channel,
                    'duration': existing_video.duration,
                    'thumbnail_url': existing_video.thumbnail_url,
                    'video_path': existing_video.video_path,
                    'folder_id': existing_video.folder_id,
                    'created_at': existing_video.created_at.isoformat() if existing_video.created_at else None
                }
                yield f"data: {json.dumps({'stage': 'complete', 'progress': 100, 'message': '影片已存在', 'video': video_data})}\n\n"
                return

            message = f'取得影片資訊成功：{info["title"]}'
            yield f"data: {json.dumps({'stage': 'info', 'progress': 20, 'message': message}, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.1)

            # 2. 下載影片
            yield f"data: {json.dumps({'stage': 'download', 'progress': 30, 'message': '正在下載影片...'})}\n\n"
            await asyncio.sleep(0.1)

            download_result = youtube_service.download_video(request.url, youtube_id)

            yield f"data: {json.dumps({'stage': 'download', 'progress': 60, 'message': '影片下載完成'})}\n\n"
            await asyncio.sleep(0.1)

            # 3. 處理字幕（在 thread pool 中執行，避免阻塞 event loop）
            yield f"data: {json.dumps({'stage': 'subtitle', 'progress': 70, 'message': '正在解析字幕...'})}\n\n"
            await asyncio.sleep(0.1)

            progress_q: queue.SimpleQueue = queue.SimpleQueue()

            def on_subtitle_progress(current: int, total: int) -> None:
                progress_q.put((current, total))

            task = asyncio.create_task(
                asyncio.to_thread(
                    subtitle_service.parse_and_translate,
                    download_result['subtitle_path'],
                    on_subtitle_progress,
                )
            )

            # 翻譯期間持續回報進度
            while not task.done():
                await asyncio.sleep(0.2)
                latest = None
                while not progress_q.empty():
                    latest = progress_q.get_nowait()
                if latest:
                    current, total = latest
                    pct = 70 + int((current / total) * 15)  # 70% → 85%
                    yield f"data: {json.dumps({'stage': 'subtitle', 'progress': pct, 'message': f'翻譯字幕中... {current}/{total} 段'})}\n\n"

            segments = task.result()  # 若 thread 拋出例外會在此重新拋出

            yield f"data: {json.dumps({'stage': 'subtitle', 'progress': 85, 'message': f'字幕處理完成，共 {len(segments)} 段'})}\n\n"
            await asyncio.sleep(0.1)

            # 4. 儲存到資料庫
            yield f"data: {json.dumps({'stage': 'save', 'progress': 90, 'message': '正在儲存到資料庫...'})}\n\n"
            await asyncio.sleep(0.1)

            video = Video(
                youtube_id=youtube_id,
                title=info['title'],
                channel=info['channel'],
                duration=info['duration'],
                thumbnail_url=info['thumbnail_url'],
                video_path=download_result['video_path']
            )
            db.add(video)
            db.flush()

            # 儲存字幕分段
            for seg in segments:
                subtitle_seg = SubtitleSegment(
                    video_id=video.id,
                    index=seg['index'],
                    start_time=seg['start_time'],
                    end_time=seg['end_time'],
                    text_en=seg['text_en'],
                    text_zh=seg['text_zh'],
                    letter_template=seg['letter_template']
                )
                db.add(subtitle_seg)

            db.commit()
            db.refresh(video)

            # 5. 完成
            video_data = {
                'id': video.id,
                'youtube_id': video.youtube_id,
                'title': video.title,
                'channel': video.channel,
                'duration': video.duration,
                'thumbnail_url': video.thumbnail_url,
                'video_path': video.video_path,
                'folder_id': video.folder_id,
                'created_at': video.created_at.isoformat() if video.created_at else None
            }

            yield f"data: {json.dumps({'stage': 'complete', 'progress': 100, 'message': '處理完成！', 'video': video_data})}\n\n"

        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"[ERROR] 下載失敗: {error_detail}")
            db.rollback()
            yield f"data: {json.dumps({'stage': 'error', 'progress': 0, 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/videos/download", response_model=VideoResponse)
async def download_video(request: VideoDownloadRequest, db: Session = Depends(get_db)):
    """
    下載 YouTube 影片和字幕

    Args:
        request: 包含 YouTube URL 的請求
        db: 資料庫連線

    Returns:
        下載的影片資訊
    """
    try:
        print(f"[DEBUG] 開始下載影片: {request.url}")

        # 取得影片資訊
        print("[DEBUG] 正在取得影片資訊...")
        info = youtube_service.get_video_info(request.url)
        youtube_id = info['youtube_id']
        print(f"[DEBUG] 影片 ID: {youtube_id}")

        # 檢查是否已下載
        existing_video = db.query(Video).filter(Video.youtube_id == youtube_id).first()
        if existing_video:
            print(f"[DEBUG] 影片已存在，返回現有記錄")
            return existing_video

        # 下載影片和字幕
        print("[DEBUG] 正在下載影片和字幕...")
        download_result = youtube_service.download_video(request.url, youtube_id)
        print(f"[DEBUG] 下載完成: {download_result}")

        # 解析並翻譯字幕（在 thread pool 中執行）
        print("[DEBUG] 正在解析並翻譯字幕...")
        segments = await asyncio.to_thread(
            subtitle_service.parse_and_translate,
            download_result['subtitle_path'],
        )
        print(f"[DEBUG] 解析完成，共 {len(segments)} 段字幕")

        # 儲存到資料庫
        print("[DEBUG] 正在儲存到資料庫...")
        video = Video(
            youtube_id=youtube_id,
            title=info['title'],
            channel=info['channel'],
            duration=info['duration'],
            thumbnail_url=info['thumbnail_url'],
            video_path=download_result['video_path']
        )
        db.add(video)
        db.flush()  # 取得 video.id

        # 儲存字幕分段
        for seg in segments:
            subtitle_seg = SubtitleSegment(
                video_id=video.id,
                index=seg['index'],
                start_time=seg['start_time'],
                end_time=seg['end_time'],
                text_en=seg['text_en'],
                text_zh=seg['text_zh'],
                letter_template=seg['letter_template']
            )
            db.add(subtitle_seg)

        db.commit()
        db.refresh(video)

        print("[DEBUG] 完成！")
        return video

    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"[ERROR] 下載失敗:")
        print(error_detail)
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/videos")
async def get_videos(db: Session = Depends(get_db)):
    """
    取得所有已下載的影片列表

    Args:
        db: 資料庫連線

    Returns:
        影片列表
    """
    videos = db.query(Video).order_by(Video.created_at.desc()).all()

    result = []
    for v in videos:
        result.append({
            "id": v.id,
            "youtube_id": v.youtube_id,
            "title": v.title,
            "channel": v.channel,
            "duration": v.duration,
            "thumbnail_url": v.thumbnail_url,
            "video_path": v.video_path,
            "folder_id": v.folder_id,
            "created_at": v.created_at.isoformat() if v.created_at else None
        })

    return result


@router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(video_id: int, db: Session = Depends(get_db)):
    """
    取得特定影片資訊
    
    Args:
        video_id: 影片 ID
        db: 資料庫連線
        
    Returns:
        影片資訊
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="影片不存在")
    return video


@router.get("/videos/{video_id}/subtitles", response_model=List[SubtitleSegmentResponse])
async def get_subtitles(video_id: int, db: Session = Depends(get_db)):
    """
    取得影片的所有字幕分段
    
    Args:
        video_id: 影片 ID
        db: 資料庫連線
        
    Returns:
        字幕分段列表
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="影片不存在")
    
    segments = db.query(SubtitleSegment).filter(
        SubtitleSegment.video_id == video_id
    ).order_by(SubtitleSegment.index).all()
    
    return segments


class SubtitleSegmentUpdate(BaseModel):
    """字幕分段更新"""
    ai_insights: Optional[str] = None


@router.put("/subtitles/{segment_id}")
async def update_subtitle_segment(
    segment_id: int,
    update_data: SubtitleSegmentUpdate,
    db: Session = Depends(get_db)
):
    """
    更新字幕分段（例如保存 AI 解說）

    Args:
        segment_id: 字幕分段 ID
        update_data: 更新資料
        db: 資料庫連線

    Returns:
        成功訊息
    """
    segment = db.query(SubtitleSegment).filter(SubtitleSegment.id == segment_id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="字幕分段不存在")

    # 更新欄位
    if update_data.ai_insights is not None:
        segment.ai_insights = update_data.ai_insights

    db.commit()
    return {"message": "更新成功"}


@router.get("/videos/{video_id}/stream")
async def stream_video(video_id: int, db: Session = Depends(get_db)):
    """
    串流影片檔案
    
    Args:
        video_id: 影片 ID
        db: 資料庫連線
        
    Returns:
        影片檔案串流
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="影片不存在")
    
    if not os.path.exists(video.video_path):
        raise HTTPException(status_code=404, detail="影片檔案不存在")
    
    return FileResponse(
        video.video_path,
        media_type="video/mp4",
        filename=f"{video.youtube_id}.mp4"
    )


@router.delete("/videos/{video_id}")
async def delete_video(video_id: int, db: Session = Depends(get_db)):
    """
    刪除影片及其所有相關檔案

    Args:
        video_id: 影片 ID
        db: 資料庫連線

    Returns:
        刪除結果
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="影片不存在")

    from pathlib import Path

    # 1. 刪除影片檔案
    try:
        if os.path.exists(video.video_path):
            os.remove(video.video_path)
            print(f"[INFO] 已刪除影片檔案: {video.video_path}")
    except Exception as e:
        print(f"[WARNING] 無法刪除影片檔案: {e}")

    # 2. 刪除字幕檔案 (使用 youtube_id 搜尋所有相關的字幕檔案)
    try:
        subtitle_dir = Path(__file__).parent.parent.parent / "downloads" / "subtitles"
        subtitle_pattern = f"{video.youtube_id}*.srt"
        subtitle_files = list(subtitle_dir.glob(subtitle_pattern))

        for subtitle_file in subtitle_files:
            subtitle_file.unlink()
            print(f"[INFO] 已刪除字幕檔案: {subtitle_file}")
    except Exception as e:
        print(f"[WARNING] 無法刪除字幕檔案: {e}")

    # 3. 刪除資料庫記錄（會自動刪除關聯的 SubtitleSegment 記錄）
    db.delete(video)
    db.commit()

    return {"message": "影片及所有相關檔案已刪除"}


# ==================== 分類資料夾管理 API ====================

@router.get("/folders")
async def get_folders(db: Session = Depends(get_db)):
    """
    取得所有分類資料夾
    
    Args:
        db: 資料庫連線
        
    Returns:
        分類資料夾列表（包含影片數量）
    """
    folders = db.query(Folder).order_by(Folder.created_at.desc()).all()
    
    result = []
    for folder in folders:
        video_count = db.query(Video).filter(Video.folder_id == folder.id).count()
        result.append({
            "id": folder.id,
            "name": folder.name,
            "color": folder.color,
            "created_at": folder.created_at.isoformat() if folder.created_at else None,
            "video_count": video_count
        })
    
    return result


@router.post("/folders")
async def create_folder(request: FolderRequest, db: Session = Depends(get_db)):
    """
    建立新的分類資料夾
    
    Args:
        request: 分類資料夾資訊
        db: 資料庫連線
        
    Returns:
        新建立的分類資料夾
    """
    folder = Folder(
        name=request.name,
        color=request.color
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    
    return {
        "id": folder.id,
        "name": folder.name,
        "color": folder.color,
        "created_at": folder.created_at.isoformat() if folder.created_at else None,
        "video_count": 0
    }


@router.put("/folders/{folder_id}")
async def update_folder(folder_id: int, request: FolderRequest, db: Session = Depends(get_db)):
    """
    更新分類資料夾
    
    Args:
        folder_id: 分類 ID
        request: 更新的資訊
        db: 資料庫連線
        
    Returns:
        更新後的分類資料夾
    """
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="分類資料夾不存在")
    
    folder.name = request.name
    folder.color = request.color
    db.commit()
    db.refresh(folder)
    
    video_count = db.query(Video).filter(Video.folder_id == folder.id).count()
    
    return {
        "id": folder.id,
        "name": folder.name,
        "color": folder.color,
        "created_at": folder.created_at.isoformat() if folder.created_at else None,
        "video_count": video_count
    }


@router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    """
    刪除分類資料夾（資料夾內的影片會移到未分類）
    
    Args:
        folder_id: 分類 ID
        db: 資料庫連線
        
    Returns:
        刪除結果
    """
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="分類資料夾不存在")
    
    # 將該資料夾內的所有影片移到未分類
    db.query(Video).filter(Video.folder_id == folder_id).update({"folder_id": None})
    
    # 刪除資料夾
    db.delete(folder)
    db.commit()
    
    return {"message": f"已刪除分類資料夾「{folder.name}」，影片已移至未分類"}


# ==================== 影片分類管理 API ====================

@router.put("/videos/{video_id}/folder")
async def move_video_to_folder(video_id: int, request: MoveVideoRequest, db: Session = Depends(get_db)):
    """
    移動影片到指定分類資料夾
    
    Args:
        video_id: 影片 ID
        request: 包含目標分類 ID（None 表示未分類）
        db: 資料庫連線
        
    Returns:
        更新後的影片資訊
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="影片不存在")
    
    # 如果指定了分類 ID，檢查分類是否存在
    if request.folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == request.folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="分類資料夾不存在")
    
    video.folder_id = request.folder_id
    db.commit()
    db.refresh(video)
    
    return {
        "id": video.id,
        "youtube_id": video.youtube_id,
        "title": video.title,
        "channel": video.channel,
        "duration": video.duration,
        "thumbnail_url": video.thumbnail_url,
        "video_path": video.video_path,
        "folder_id": video.folder_id,
        "created_at": video.created_at.isoformat() if video.created_at else None
    }


@router.get("/folders/{folder_id}/videos")
async def get_videos_by_folder(folder_id: int, db: Session = Depends(get_db)):
    """
    取得特定分類下的所有影片
    
    Args:
        folder_id: 分類 ID（0 或 'uncategorized' 表示未分類）
        db: 資料庫連線
        
    Returns:
        影片列表
    """
    # 特殊處理：folder_id = 0 表示未分類
    if folder_id == 0:
        videos = db.query(Video).filter(Video.folder_id.is_(None)).order_by(Video.created_at.desc()).all()
    else:
        # 檢查分類是否存在
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="分類資料夾不存在")
        
        videos = db.query(Video).filter(Video.folder_id == folder_id).order_by(Video.created_at.desc()).all()
    
    result = []
    for v in videos:
        result.append({
            "id": v.id,
            "youtube_id": v.youtube_id,
            "title": v.title,
            "channel": v.channel,
            "duration": v.duration,
            "thumbnail_url": v.thumbnail_url,
            "video_path": v.video_path,
            "folder_id": v.folder_id,
            "created_at": v.created_at.isoformat() if v.created_at else None
        })
    
    return result


# ===== AI 設定與解說相關路由 =====

class AISettingsRequest(BaseModel):
    """AI 設定請求"""
    provider: str
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-5-mini"
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.5-flash"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"


class AISettingsResponse(BaseModel):
    """AI 設定回應（隱藏完整 API Key）"""
    provider: str
    openai_api_key_masked: Optional[str] = None
    openai_model: str
    gemini_model: str
    gemini_api_key_masked: Optional[str] = None
    ollama_base_url: str
    ollama_model: str
    updated_at: Optional[datetime] = None


class AIExplainRequest(BaseModel):
    """AI 解說請求"""
    text: str
    context: str = ""


class AIExplainResponse(BaseModel):
    """AI 解說回應"""
    explanation: str


def _mask_api_key(api_key: str = None) -> str:
    """
    遮罩 API Key，只顯示前後幾碼
    
    Args:
        api_key: 完整的 API Key
    
    Returns:
        遮罩後的 API Key（例如：sk-...xyz）
    """
    if not api_key or len(api_key) < 8:
        return None
    return f"{api_key[:6]}...{api_key[-4:]}"


@router.get("/ai-settings", response_model=AISettingsResponse)
async def get_ai_settings(db: Session = Depends(get_db)):
    """
    取得 AI 設定（遮罩 API Key）
    """
    settings = db.query(AISettings).first()
    
    if not settings:
        # 如果沒有設定，返回預設值
        return AISettingsResponse(
            provider="gemini",
            openai_api_key_masked=None,
            openai_model="gpt-5-mini",
            gemini_api_key_masked=None,
            gemini_model="gemini-2.5-flash",
            ollama_base_url="http://localhost:11434",
            ollama_model="llama3.1:8b"
        )
    
    return AISettingsResponse(
        provider=settings.provider,
        openai_api_key_masked=_mask_api_key(settings.openai_api_key),
        openai_model=settings.openai_model,
        gemini_api_key_masked=_mask_api_key(settings.gemini_api_key),
        gemini_model=settings.gemini_model,
        ollama_base_url=settings.ollama_base_url,
        ollama_model=settings.ollama_model,
        updated_at=settings.updated_at
    )


@router.put("/ai-settings")
async def update_ai_settings(
    request: AISettingsRequest,
    db: Session = Depends(get_db)
):
    """
    更新 AI 設定
    """
    settings = db.query(AISettings).first()
    
    if not settings:
        # 如果沒有設定記錄，創建新的
        settings = AISettings()
        db.add(settings)
    
    # 更新設定
    settings.provider = request.provider
    settings.openai_model = request.openai_model
    settings.gemini_model = request.gemini_model
    settings.ollama_base_url = request.ollama_base_url
    settings.ollama_model = request.ollama_model
    
    # 只在提供新的 API Key 時才更新（避免覆蓋現有的 Key）
    if request.openai_api_key:
        settings.openai_api_key = request.openai_api_key
    if request.gemini_api_key:
        settings.gemini_api_key = request.gemini_api_key
    
    settings.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "AI 設定已更新"}


@router.post("/ai-settings/test")
async def test_ai_connection(db: Session = Depends(get_db)):
    """
    測試 AI 服務連線
    """
    try:
        ai_service = get_ai_service(db)
        result = ai_service.test_connection()
        return result
    except Exception as e:
        return {"success": False, "message": f"測試失敗: {str(e)}"}


@router.post("/ai-explain", response_model=AIExplainResponse)
async def explain_sentence(
    request: AIExplainRequest,
    db: Session = Depends(get_db)
):
    """
    使用 AI 解說句子
    """
    try:
        ai_service = get_ai_service(db)
        explanation = ai_service.explain_sentence(request.text, request.context)
        return AIExplainResponse(explanation=explanation)
    except ValueError as e:
        # 設定相關的錯誤（如 API Key 未設定）
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 其他錯誤
        raise HTTPException(status_code=500, detail=f"AI 解說失敗: {str(e)}")


@router.get("/ai-settings/ollama-models")
async def get_ollama_models(db: Session = Depends(get_db)):
    """
    取得本地 Ollama 已安裝的模型列表
    """
    try:
        ai_service = get_ai_service(db)
        models = ai_service.get_ollama_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"無法獲取 Ollama 模型列表: {str(e)}")

