/**
 * 分類資料夾管理元件
 */
import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';
import { folderApi } from '../services/api';
import type { Folder } from '../types';

interface FolderManagerProps {
  onClose: () => void;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4', // Cyan
];

const FolderManager = ({ onClose }: FolderManagerProps) => {
  const { folders, addFolder, updateFolder, removeFolder, setFolders } = useVideoStore();
  
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(PRESET_COLORS[0]);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 建立新分類
  const handleCreate = async () => {
    if (!newFolderName.trim()) {
      alert('請輸入分類名稱');
      return;
    }

    try {
      setIsCreating(true);
      const newFolder = await folderApi.createFolder(newFolderName.trim(), newFolderColor);
      addFolder(newFolder);
      setNewFolderName('');
      setNewFolderColor(PRESET_COLORS[0]);
    } catch (error) {
      console.error('建立分類失敗:', error);
      alert('建立分類失敗，請稍後再試');
    } finally {
      setIsCreating(false);
    }
  };

  // 開始編輯
  const handleStartEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setEditName(folder.name);
    setEditColor(folder.color);
  };

  // 儲存編輯
  const handleSaveEdit = async () => {
    if (!editingFolder || !editName.trim()) {
      alert('請輸入分類名稱');
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await folderApi.updateFolder(editingFolder.id, editName.trim(), editColor);
      updateFolder(updated);
      setEditingFolder(null);
    } catch (error) {
      console.error('更新分類失敗:', error);
      alert('更新分類失敗，請稍後再試');
    } finally {
      setIsUpdating(false);
    }
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setEditingFolder(null);
    setEditName('');
    setEditColor('');
  };

  // 刪除分類
  const handleDelete = async (folderId: number) => {
    if (!confirm('確定要刪除此分類嗎？分類內的影片會移到未分類。')) {
      return;
    }

    try {
      setDeletingId(folderId);
      await folderApi.deleteFolder(folderId);
      removeFolder(folderId);
      
      // 重新載入資料夾資訊
      const foldersData = await folderApi.getFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error('刪除分類失敗:', error);
      alert('刪除分類失敗，請稍後再試');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">管理分類</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 內容區 */}
        <div className="p-6 space-y-6">
          {/* 建立新分類 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">建立新分類</h3>
            
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="分類名稱"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />

            {/* 顏色選擇 */}
            <div className="flex gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewFolderColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    newFolderColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <button
              onClick={handleCreate}
              disabled={isCreating || !newFolderName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
              {isCreating ? '建立中...' : '建立分類'}
            </button>
          </div>

          {/* 現有分類列表 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">現有分類</h3>
            
            {folders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                尚無分類
              </p>
            ) : (
              <div className="space-y-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    {editingFolder?.id === folder.id ? (
                      // 編輯模式
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        
                        <div className="flex gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              className={`w-6 h-6 rounded-full transition-transform ${
                                editColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={isUpdating}
                            className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
                          >
                            <Save size={14} />
                            儲存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded text-sm transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 顯示模式
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {folder.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({folder.video_count} 個影片)
                          </span>
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartEdit(folder)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="編輯"
                          >
                            <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(folder.id)}
                            disabled={deletingId === folder.id}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                            title="刪除"
                          >
                            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderManager;

