/**
 * 側邊欄元件 - 可展開/收起的歷史紀錄側邊欄
 */
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FolderOpen, Home } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';
import FolderList from './FolderList';
import VideoHistoryList from './VideoHistoryList';
import VideoDetailModal from './VideoDetailModal';
import { folderApi, videoApi } from '../services/api';
import type { Video } from '../types';

const Sidebar = () => {
  const { 
    sidebarOpen, 
    toggleSidebar,
    folders,
    setFolders,
    selectedFolderId,
    setSelectedFolderId,
    videos,
    setVideos,
  } = useVideoStore();
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);

  // 載入分類資料夾和影片
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [foldersData, videosData] = await Promise.all([
          folderApi.getFolders(),
          videoApi.getVideos(),
        ]);
        setFolders(foldersData);
        setVideos(videosData);
      } catch (error) {
        console.error('載入資料失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setFolders, setVideos]);

  // 根據選中的分類過濾影片
  const filteredVideos = selectedFolderId === null 
    ? videos // 顯示全部
    : selectedFolderId === 0
    ? videos.filter(v => !v.folder_id) // 未分類
    : videos.filter(v => v.folder_id === selectedFolderId); // 特定分類

  return (
    <>
      {/* 展開/收起按鈕 */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-20 z-50 bg-indigo-600 text-white p-2 rounded-r-lg shadow-lg hover:bg-indigo-700 transition-all duration-300 ${
          sidebarOpen ? 'left-80' : 'left-0'
        }`}
        aria-label={sidebarOpen ? '收起側邊欄' : '展開側邊欄'}
      >
        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* 側邊欄主體 */}
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        {/* 標題區 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-2 text-white">
            <FolderOpen size={24} />
            <h2 className="text-xl font-bold">影片歷史紀錄</h2>
          </div>
        </div>

        {/* 主要內容區 */}
        <div className="flex flex-col h-[calc(100vh-73px)]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* 分類列表區 */}
              <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <FolderList />
              </div>

              {/* 影片列表區 */}
              <div className="flex-1 overflow-y-auto">
                {/* 頂部標題 */}
                <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedFolderId === null 
                        ? '全部影片' 
                        : selectedFolderId === 0
                        ? '未分類'
                        : folders.find(f => f.id === selectedFolderId)?.name || '未知分類'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {filteredVideos.length} 個影片
                  </span>
                </div>

                <VideoHistoryList 
                  videos={filteredVideos}
                  onVideoClick={setSelectedVideo}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 遮罩層 - 手機版點擊關閉 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* 影片詳情 Modal */}
      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
};

export default Sidebar;

