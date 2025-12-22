/**
 * 練習頁面
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';
import { videoApi } from '../services/api';
import NavBar from '../components/NavBar';
import VideoPlayer from '../components/VideoPlayer';
import SegmentList from '../components/SegmentList';
import PlaybackControls from '../components/PlaybackControls';
import FillBlanksInput from '../components/FillBlanksInput';
import ActionButtons from '../components/ActionButtons';
import Sidebar from '../components/Sidebar';
import AIExplanationCard from '../components/AIExplanationModal';

export default function PracticePage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    currentVideo,
    segments,
    currentSegmentIndex,
    showTranslation,
    setCurrentVideo,
    setSegments,
    saveProgress,
  } = useVideoStore();
  
  // 載入影片和字幕資料
  useEffect(() => {
    const loadVideoData = async () => {
      if (!videoId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 載入影片資訊
        const video = await videoApi.getVideo(parseInt(videoId));
        setCurrentVideo(video);
        
        // 載入字幕分段
        const subtitles = await videoApi.getSubtitles(parseInt(videoId));
        setSegments(subtitles);
        
      } catch (err) {
        console.error('載入失敗:', err);
        setError('無法載入影片資料，請稍後再試');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideoData();
  }, [videoId, setCurrentVideo, setSegments]);
  
  // 自動儲存進度
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress();
    }, 10000); // 每 10 秒儲存一次
    
    return () => clearInterval(interval);
  }, [saveProgress]);
  
  // 離開頁面時儲存進度
  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [saveProgress]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !currentVideo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <p className="text-red-600 mb-6 text-lg">{error || '影片不存在'}</p>
          <button onClick={() => navigate('/')} className="btn-gradient">
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  const videoUrl = videoApi.getVideoStreamUrl(currentVideo.id);
  const currentSegment = segments[currentSegmentIndex];

  return (
    <div className="min-h-screen">
      <NavBar />
      <Sidebar />

      {/* 主要內容區 */}
      <main className="pt-20 md:pt-24 px-4 md:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* 影片標題 */}
          <div className="mb-6 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {currentVideo.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{currentVideo.channel}</p>
          </div>

          {/* 上半部：影片播放器 + 控制面板 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 左側：影片播放器 (2/3) */}
            <div className="lg:col-span-2 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="glass-card p-4">
                <div className="aspect-video overflow-hidden rounded-lg">
                  <VideoPlayer videoUrl={videoUrl} />
                </div>
              </div>
            </div>

            {/* 右側：控制面板 (1/3) */}
            <div className="space-y-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <SegmentList />
              <PlaybackControls />
            </div>
          </div>

          {/* 下半部：填空練習區 + 動作按鈕 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左側：填空練習區 (3/4) */}
            <div className="lg:col-span-3 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <FillBlanksInput />

              {/* 翻譯顯示 */}
              {showTranslation && currentSegment && (
                <div className="mt-4 glass-card p-6 border-l-4 border-blue-500 animate-slide-in">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                    🌏 繁體中文翻譯
                  </p>
                  <p className="text-lg text-gray-900 dark:text-white">{currentSegment.text_zh}</p>
                </div>
              )}

              {/* AI 解說卡片 */}
              <AIExplanationCard />
            </div>

            {/* 右側：動作按鈕 (1/4) */}
            <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <ActionButtons />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

