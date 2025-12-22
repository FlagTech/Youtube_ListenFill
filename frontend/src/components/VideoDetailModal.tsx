/**
 * 影片詳情 Modal 元件
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Trash2, FolderInput, Clock, Calendar } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';
import { videoApi, folderApi } from '../services/api';
import type { Video } from '../types';

interface VideoDetailModalProps {
  video: Video;
  onClose: () => void;
}

const VideoDetailModal = ({ video, onClose }: VideoDetailModalProps) => {
  const navigate = useNavigate();
  const { 
    folders, 
    updateVideo, 
    removeVideo,
    setFolders,
  } = useVideoStore();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // 格式化時長
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h} 小時 ${m} 分鐘`;
    }
    return `${m} 分 ${s} 秒`;
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 開始練習
  const handleStartPractice = () => {
    navigate(`/practice/${video.id}`);
    onClose();
  };

  // 移動到資料夾
  const handleMoveToFolder = async (folderId: number | null) => {
    try {
      setIsMoving(true);
      const updatedVideo = await videoApi.moveVideoToFolder(video.id, folderId);
      updateVideo(updatedVideo);
      
      // 重新載入資料夾資訊以更新影片計數
      const foldersData = await folderApi.getFolders();
      setFolders(foldersData);
      
      onClose();
    } catch (error) {
      console.error('移動影片失敗:', error);
      alert('移動影片失敗，請稍後再試');
    } finally {
      setIsMoving(false);
    }
  };

  // 刪除影片
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await videoApi.deleteVideo(video.id);
      removeVideo(video.id);
      
      // 重新載入資料夾資訊以更新影片計數
      const foldersData = await folderApi.getFolders();
      setFolders(foldersData);
      
      onClose();
    } catch (error) {
      console.error('刪除影片失敗:', error);
      alert('刪除影片失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">影片詳情</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 內容區 */}
        <div className="p-6 space-y-6">
          {/* 縮圖 */}
          <div className="relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full aspect-video object-cover"
            />
          </div>

          {/* 影片資訊 */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {video.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400">
              {video.channel}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{formatDuration(video.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{formatDate(video.created_at)}</span>
              </div>
            </div>
          </div>

          {/* 移動到資料夾 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FolderInput size={16} />
              移動到資料夾
            </label>
            <select
              value={video.folder_id || 0}
              onChange={(e) => handleMoveToFolder(e.target.value === '0' ? null : parseInt(e.target.value))}
              disabled={isMoving}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={0}>未分類</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <button
              onClick={handleStartPractice}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Play size={20} />
              開始練習
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="px-6 py-3 border-2 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* 刪除確認對話框 */}
          {showDeleteConfirm && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-300 font-medium mb-3">
                確定要刪除這個影片嗎？此操作無法復原。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? '刪除中...' : '確認刪除'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetailModal;

