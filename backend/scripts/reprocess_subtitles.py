"""
重新處理現有影片的字幕
將舊的 SRT 字幕替換為新的 VTT 逐字時間戳記處理結果

使用方法:
    uv run python scripts/reprocess_subtitles.py [video_id]
    
    不提供 video_id 則處理所有影片
"""
import sys
from pathlib import Path

# 添加 backend 路徑
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.models.database import get_db, Video, SubtitleSegment
from app.services.youtube_service import youtube_service
from app.services.subtitle_service import subtitle_service


def reprocess_video_subtitles(video_id: int, db):
    """
    重新處理指定影片的字幕
    
    Args:
        video_id: 影片 ID
        db: 資料庫連線
    """
    print(f"\n{'='*80}")
    print(f"處理影片 ID: {video_id}")
    print(f"{'='*80}")
    
    # 取得影片資訊
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        print(f"❌ 找不到影片 ID {video_id}")
        return False
    
    print(f"標題: {video.title}")
    print(f"YouTube ID: {video.youtube_id}")
    
    # 檢查是否有舊字幕
    old_segments = db.query(SubtitleSegment).filter(
        SubtitleSegment.video_id == video_id
    ).count()
    print(f"舊字幕段落數: {old_segments}")
    
    # 檢查是否需要重新下載 VTT 字幕
    subtitle_dir = Path(backend_path) / "downloads" / "subtitles"
    vtt_path = subtitle_dir / f"{video.youtube_id}.en.vtt"
    
    if not vtt_path.exists():
        print(f"\n⚠️  找不到 VTT 字幕檔案")
        print(f"   需要從 YouTube 重新下載...")
        
        # 重新下載
        try:
            youtube_url = f"https://www.youtube.com/watch?v={video.youtube_id}"
            download_result = youtube_service.download_video(youtube_url, video.youtube_id)
            print(f"✅ 重新下載完成")
            vtt_path = Path(download_result['subtitle_path'])
        except Exception as e:
            print(f"❌ 重新下載失敗: {e}")
            return False
    else:
        print(f"✅ 找到 VTT 字幕檔案: {vtt_path}")
    
    # 使用新的 VTT 處理邏輯
    print(f"\n處理 VTT 字幕...")
    try:
        segments = subtitle_service.parse_and_translate(str(vtt_path))
        print(f"✅ 處理完成，共 {len(segments)} 個段落")
    except Exception as e:
        print(f"❌ 處理失敗: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # 刪除舊字幕
    print(f"\n刪除舊字幕...")
    db.query(SubtitleSegment).filter(
        SubtitleSegment.video_id == video_id
    ).delete()
    print(f"✅ 已刪除 {old_segments} 個舊段落")
    
    # 儲存新字幕
    print(f"\n儲存新字幕...")
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
    print(f"✅ 已儲存 {len(segments)} 個新段落")
    
    # 統計
    print(f"\n{'='*80}")
    print(f"📊 處理結果")
    print(f"{'='*80}")
    print(f"影片 ID:       {video_id}")
    print(f"舊段落數:      {old_segments}")
    print(f"新段落數:      {len(segments)}")
    print(f"壓縮率:        {(1 - len(segments)/old_segments)*100:.1f}%" if old_segments > 0 else "N/A")
    
    return True


def reprocess_all_videos():
    """重新處理所有影片的字幕"""
    db = next(get_db())
    
    try:
        # 取得所有影片
        videos = db.query(Video).all()
        total = len(videos)
        
        print(f"\n{'='*80}")
        print(f"準備處理 {total} 個影片")
        print(f"{'='*80}")
        
        success_count = 0
        fail_count = 0
        
        for i, video in enumerate(videos, 1):
            print(f"\n[{i}/{total}] 處理影片: {video.title}")
            
            if reprocess_video_subtitles(video.id, db):
                success_count += 1
            else:
                fail_count += 1
        
        # 總結
        print(f"\n{'='*80}")
        print(f"🎯 總結")
        print(f"{'='*80}")
        print(f"總影片數:      {total}")
        print(f"成功處理:      {success_count}")
        print(f"處理失敗:      {fail_count}")
        
        if success_count == total:
            print(f"\n✅ 所有影片已成功重新處理！")
        else:
            print(f"\n⚠️  有 {fail_count} 個影片處理失敗")
            
    finally:
        db.close()


def main():
    """主程式"""
    print(f"\n{'='*80}")
    print("重新處理字幕工具")
    print("將舊的 SRT 字幕替換為新的 VTT 逐字時間戳記處理結果")
    print(f"{'='*80}")
    
    if len(sys.argv) > 1:
        # 處理指定的影片
        try:
            video_id = int(sys.argv[1])
            db = next(get_db())
            try:
                success = reprocess_video_subtitles(video_id, db)
                if success:
                    print(f"\n✅ 影片 {video_id} 處理完成")
                else:
                    print(f"\n❌ 影片 {video_id} 處理失敗")
            finally:
                db.close()
        except ValueError:
            print(f"❌ 無效的影片 ID: {sys.argv[1]}")
    else:
        # 處理所有影片
        print("\n⚠️  將處理所有影片")
        confirm = input("確定要繼續嗎? (y/N): ")
        
        if confirm.lower() == 'y':
            reprocess_all_videos()
        else:
            print("已取消")


if __name__ == "__main__":
    main()

