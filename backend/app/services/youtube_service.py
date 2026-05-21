"""
YouTube 影片下載服務
"""
import os
import yt_dlp
from typing import Dict, Optional
from pathlib import Path


class YouTubeService:
    """YouTube 影片下載服務類別"""

    def __init__(self):
        # 使用絕對路徑（專案根目錄）
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.download_dir = base_dir / "downloads"
        self.video_dir = self.download_dir / "videos"
        self.subtitle_dir = self.download_dir / "subtitles"

        # 確保目錄存在
        self.video_dir.mkdir(parents=True, exist_ok=True)
        self.subtitle_dir.mkdir(parents=True, exist_ok=True)

    def get_video_info(self, url: str) -> Dict:
        """
        取得 YouTube 影片資訊

        Args:
            url: YouTube 影片網址

        Returns:
            影片資訊字典
        """
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'sleep_interval': 1,
            'max_sleep_interval': 5,
            'retries': 3,
            'extractor_args': {'youtube': {'player_client': ['android']}},
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                return {
                    'youtube_id': info.get('id'),
                    'title': info.get('title'),
                    'channel': info.get('uploader') or info.get('channel'),
                    'duration': info.get('duration', 0),
                    'thumbnail_url': info.get('thumbnail'),
                    'has_subtitles': 'en' in (info.get('subtitles', {}) or {}),
                }
        except Exception as e:
            raise Exception(f"無法取得影片資訊: {str(e)}")

    def download_video(self, url: str, video_id: str) -> Dict:
        """
        下載 YouTube 影片和英文字幕（分開下載以避免 429 錯誤）

        優先使用手動字幕（SRT 格式），若無則使用自動字幕（VTT 格式含逐字時間戳記）

        Args:
            url: YouTube 影片網址
            video_id: 影片 ID

        Returns:
            下載結果字典，包含檔案路徑和字幕類型
        """
        import shutil

        video_filename = f"{video_id}.mp4"
        video_path = self.video_dir / video_filename

        # 第一步：檢查字幕可用性
        print(f"[DEBUG] 檢查字幕可用性...")
        check_opts = {
            'quiet': True,
            'no_warnings': True,
            'sleep_interval': 1,
            'max_sleep_interval': 5,
            'retries': 3,
            'extractor_args': {'youtube': {'player_client': ['android']}},
        }

        has_manual_subs = False
        has_auto_subs = False

        try:
            with yt_dlp.YoutubeDL(check_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                # 檢查手動字幕
                if 'subtitles' in info and info['subtitles'] and 'en' in info['subtitles']:
                    has_manual_subs = True
                    print(f"[INFO] 偵測到手動字幕")

                # 檢查自動字幕
                if 'automatic_captions' in info and info['automatic_captions'] and 'en' in info['automatic_captions']:
                    has_auto_subs = True
                    print(f"[INFO] 偵測到自動字幕")

                if not has_manual_subs and not has_auto_subs:
                    raise Exception("此影片沒有英文字幕（手動或自動）")

        except Exception as e:
            raise Exception(f"檢查字幕時發生錯誤: {str(e)}")

        # 等待 2 秒，避免請求過於頻繁
        import time
        print(f"[DEBUG] 等待 2 秒以避免請求過於頻繁...")
        time.sleep(2)

        # 第二步：根據字幕類型決定下載格式
        if has_manual_subs:
            subtitle_format = 'srt'
            subtitle_filename = f"{video_id}.en.srt"
            print(f"[INFO] 使用手動字幕（SRT 格式）")
        else:
            subtitle_format = 'vtt'
            subtitle_filename = f"{video_id}.en.vtt"
            print(f"[INFO] 使用自動字幕（VTT 格式）")

        subtitle_path = self.subtitle_dir / subtitle_filename

        try:
            # 第三步：先下載影片（不下載字幕）
            print(f"[DEBUG] 步驟 1/2: 下載影片...")
            print(f"[DEBUG] 影片路徑: {video_path}")

            video_opts = {
                'format': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best',
                'merge_output_format': 'mp4',
                'outtmpl': str(video_path),
                'quiet': False,
                'no_warnings': True,
                'sleep_interval': 1,
                'max_sleep_interval': 5,
                'retries': 3,
                'writesubtitles': False,
                'writeautomaticsub': False,
                'extractor_args': {'youtube': {'player_client': ['android']}},
            }

            with yt_dlp.YoutubeDL(video_opts) as ydl:
                ydl.download([url])
                print(f"[DEBUG] 影片下載完成")

            import time
            if has_manual_subs:
                wait_time = 3
                print(f"[DEBUG] 等待 {wait_time} 秒後再下載手動字幕...")
            else:
                wait_time = 5
                print(f"[DEBUG] 等待 {wait_time} 秒後再下載自動字幕（VTT）...")
            time.sleep(wait_time)

            # 第四步：單獨下載字幕（避免 429 錯誤）
            print(f"[DEBUG] 步驟 2/2: 下載字幕...")
            print(f"[DEBUG] 字幕路徑: {subtitle_path}")

            subtitle_opts = {
                'skip_download': True,
                'writesubtitles': has_manual_subs,
                'writeautomaticsub': not has_manual_subs,
                'subtitleslangs': ['en'],
                'subtitlesformat': subtitle_format,
                'outtmpl': str(self.video_dir / video_id),
                'quiet': False,
                'no_warnings': True,
                'sleep_interval': 3 if not has_manual_subs else 1,
                'max_sleep_interval': 10 if not has_manual_subs else 5,
                'retries': 2,
                'extractor_args': {'youtube': {'player_client': ['android']}},
            }

            with yt_dlp.YoutubeDL(subtitle_opts) as ydl:
                ydl.download([url])
                print(f"[DEBUG] 字幕下載完成")

            # 第五步：尋找並移動字幕檔案
            print(f"[DEBUG] 搜尋字幕檔案...")
            subtitle_files = list(self.video_dir.glob(f"{video_id}*.en*.{subtitle_format}"))

            print(f"[DEBUG] 找到的字幕檔案: {subtitle_files}")

            if subtitle_files:
                shutil.move(str(subtitle_files[0]), str(subtitle_path))
                print(f"[DEBUG] 字幕已移動到: {subtitle_path}")
            else:
                print(f"[DEBUG] 未找到字幕，檢查所有 .{subtitle_format} 檔案...")
                all_subs = list(self.video_dir.glob(f"*.{subtitle_format}"))
                print(f"[DEBUG] 所有 .{subtitle_format} 檔案: {all_subs}")

                if not all_subs:
                    raise Exception(f"無法下載英文字幕（{subtitle_format} 格式）")

                shutil.move(str(all_subs[0]), str(subtitle_path))
                print(f"[DEBUG] 使用字幕: {all_subs[0]}")

            return {
                'video_path': str(video_path),
                'subtitle_path': str(subtitle_path),
                'subtitle_type': 'manual' if has_manual_subs else 'auto',
                'subtitle_format': subtitle_format,
                'success': True
            }

        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"[ERROR] 下載錯誤:")
            print(error_detail)
            raise Exception(f"下載失敗: {str(e)}")

    def extract_youtube_id(self, url: str) -> Optional[str]:
        """
        從 YouTube URL 提取影片 ID

        Args:
            url: YouTube 影片網址

        Returns:
            影片 ID 或 None
        """
        try:
            with yt_dlp.YoutubeDL({
                'quiet': True,
                'sleep_interval': 1,
                'max_sleep_interval': 5,
                'retries': 3,
                'extractor_args': {'youtube': {'player_client': ['android']}},
            }) as ydl:
                info = ydl.extract_info(url, download=False)
                return info.get('id')
        except:
            return None


# 建立全域實例
youtube_service = YouTubeService()
