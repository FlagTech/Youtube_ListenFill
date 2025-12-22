/**
 * 分類資料夾清單元件
 */
import { useState } from 'react';
import { Folder, FolderPlus, Inbox, Menu } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';
import FolderManager from './FolderManager';

const FolderList = () => {
  const { 
    folders, 
    selectedFolderId, 
    setSelectedFolderId,
    videos,
  } = useVideoStore();
  
  const [showManager, setShowManager] = useState(false);

  // 計算未分類影片數量
  const uncategorizedCount = videos.filter(v => !v.folder_id).length;
  
  // 計算全部影片數量
  const totalCount = videos.length;

  return (
    <div className="p-3">
      {/* 全部影片 */}
      <button
        onClick={() => setSelectedFolderId(null)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors mb-2 ${
          selectedFolderId === null
            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Menu size={18} />
          <span className="text-sm font-medium">全部影片</span>
        </div>
        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
          {totalCount}
        </span>
      </button>

      {/* 未分類 */}
      <button
        onClick={() => setSelectedFolderId(0)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors mb-3 ${
          selectedFolderId === 0
            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Inbox size={18} />
          <span className="text-sm font-medium">未分類</span>
        </div>
        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
          {uncategorizedCount}
        </span>
      </button>

      {/* 分隔線 */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-3"></div>

      {/* 標題與新增按鈕 */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          我的分類
        </span>
        <button
          onClick={() => setShowManager(true)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="管理分類"
        >
          <FolderPlus size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* 分類列表 */}
      <div className="space-y-1">
        {folders.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">尚無分類</p>
            <button
              onClick={() => setShowManager(true)}
              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              建立第一個分類
            </button>
          </div>
        ) : (
          folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedFolderId === folder.id
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder 
                  size={18} 
                  style={{ color: folder.color }}
                  fill={selectedFolderId === folder.id ? folder.color : 'none'}
                />
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {folder.name}
                </span>
              </div>
              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                {folder.video_count}
              </span>
            </button>
          ))
        )}
      </div>

      {/* 分類管理 Modal */}
      {showManager && (
        <FolderManager onClose={() => setShowManager(false)} />
      )}
    </div>
  );
};

export default FolderList;

