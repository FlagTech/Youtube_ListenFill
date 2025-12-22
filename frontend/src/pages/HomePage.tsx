import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Play, Trash2, Youtube } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';
import { videoApi } from '../services/api';
import type { DownloadProgress as DownloadProgressType } from '../services/api';
import NavBar from '../components/NavBar';
import DownloadProgress from '../components/DownloadProgress';
import Sidebar from '../components/Sidebar';

export default function HomePage() {
  const navigate = useNavigate();
  const { videos, setVideos, addVideo } = useVideoStore();

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressType | null>(null);

  // 載入影片列表
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const videoList = await videoApi.getVideos();
        setVideos(videoList);
      } catch (err) {
        console.error('載入影片列表失敗:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [setVideos]);

  // 下載影片
  const handleDownload = async () => {
    if (!youtubeUrl.trim()) {
      setDownloadError('請輸入 YouTube 網址');
      return;
    }

    // 清理 URL，移除 & 及之後的參數（例如 &t=8s）
    const cleanUrl = youtubeUrl.trim().split('&')[0];

    try {
      setDownloading(true);
      setDownloadError(null);
      setDownloadProgress(null);

      const video = await videoApi.downloadVideoWithProgress(
        cleanUrl,
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      addVideo(video);
      setYoutubeUrl('');

      // 保持完成狀態顯示 2 秒
      setTimeout(() => {
        setDownloadProgress(null);
      }, 2000);
    } catch (err: any) {
      console.error('下載失敗:', err);
      setDownloadError(err.message || '下載失敗，請確認網址是否正確');
      setDownloadProgress(null);
    } finally {
      setDownloading(false);
    }
  };

  // 刪除影片
  const handleDelete = async (videoId: number) => {
    if (!confirm('確定要刪除這個影片嗎？')) return;

    try {
      await videoApi.deleteVideo(videoId);
      const updatedVideos = videos.filter(v => v.id !== videoId);
      setVideos(updatedVideos);
    } catch (err) {
      console.error('刪除失敗:', err);
      alert('刪除失敗，請稍後再試');
    }
  };

  // 開始練習
  const handleStartPractice = (videoId: number) => {
    navigate(`/practice/${videoId}`);
  };

  // 格式化時長
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <Sidebar />

      {/* 主要內容 */}
      <main className="pt-20 md:pt-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero 標題 */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              YouTube 聽打練習
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              透過 YouTube 影片提升英語聽力與拼寫能力
            </p>
          </div>

          {/* 下載區域 */}
          <div className="glass-card p-6 md:p-8 mb-12 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-3 mb-6">
              <Download className="text-blue-600" size={28} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">下載 YouTube 影片</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="輸入 YouTube 影片網址..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all"
                disabled={downloading}
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              />
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-gradient flex items-center justify-center gap-2 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={20} />
                {downloading ? '下載中...' : '下載影片'}
              </button>
            </div>
            {downloadError && (
              <p className="mt-4 text-red-600 text-sm font-medium">{downloadError}</p>
            )}
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <span>💡</span>
              <span>提示：請確保影片有英文字幕（自動生成或手動上傳皆可）</span>
            </p>
          </div>

          {/* 下載進度 */}
          {downloadProgress && (
            <div className="mb-12">
              <DownloadProgress
                stage={downloadProgress.stage}
                progress={downloadProgress.progress}
                message={downloadProgress.message}
              />
            </div>
          )}

          {/* 影片列表 */}
          <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              已下載的影片
            </h2>

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 text-lg">載入中...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="glass-card text-center py-20">
                <Youtube size={80} className="mx-auto text-gray-300 dark:text-gray-600 mb-6" />
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">尚未下載任何影片</p>
                <p className="text-gray-500 dark:text-gray-400">請在上方輸入 YouTube 網址開始下載</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="glass-card overflow-hidden hover:scale-105 transition-all duration-300 group animate-fade-in-up"
                    style={{animationDelay: `${0.1 * (index % 6)}s`}}
                  >
                    {/* 縮圖 */}
                    <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg font-semibold">
                        {formatDuration(video.duration)}
                      </div>
                    </div>

                    {/* 資訊 */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 text-lg">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{video.channel}</p>

                      {/* 操作按鈕 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartPractice(video.id)}
                          className="flex-1 btn-gradient flex items-center justify-center gap-2 py-2 px-4 text-sm"
                        >
                          <Play size={16} />
                          開始練習
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="刪除影片"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
