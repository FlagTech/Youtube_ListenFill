/**
 * 影片歷史清單元件
 */
import { Clock, Play } from 'lucide-react';
import type { Video } from '../types';

interface VideoHistoryListProps {
  videos: Video[];
  onVideoClick: (video: Video) => void;
}

const VideoHistoryList = ({ videos, onVideoClick }: VideoHistoryListProps) => {
  // 格式化時長 (秒 -> MM:SS 或 HH:MM:SS)
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月前`;
    return `${Math.floor(diffDays / 365)} 年前`;
  };

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <div className="text-gray-400 dark:text-gray-600 mb-3">
          <Play size={48} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          此分類目前沒有影片
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {videos.map((video) => (
        <button
          key={video.id}
          onClick={() => onVideoClick(video)}
          className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
        >
          {/* 縮圖區 */}
          <div className="relative mb-2 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full aspect-video object-cover group-hover:opacity-90 transition-opacity"
              onError={(e) => {
                // 圖片載入失敗時顯示預設圖示
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* 時長標籤 */}
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </div>
            {/* Hover 播放圖示 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30">
              <Play size={32} className="text-white fill-white" />
            </div>
          </div>

          {/* 影片資訊 */}
          <div className="space-y-1">
            {/* 標題 */}
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
              {video.title}
            </h3>
            
            {/* 頻道 */}
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {video.channel}
            </p>
            
            {/* 日期 */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
              <Clock size={12} />
              <span>{formatDate(video.created_at)}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default VideoHistoryList;

