/**
 * 下載進度條組件
 */
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

interface DownloadProgressProps {
  stage: 'info' | 'download' | 'subtitle' | 'save' | 'complete' | 'error';
  progress: number;
  message: string;
}

const stageNames = {
  info: '取得資訊',
  download: '下載影片',
  subtitle: '處理字幕',
  save: '儲存資料',
  complete: '完成',
  error: '錯誤',
};

const stageColors = {
  info: 'bg-blue-500',
  download: 'bg-indigo-500',
  subtitle: 'bg-purple-500',
  save: 'bg-green-500',
  complete: 'bg-green-600',
  error: 'bg-red-500',
};

export default function DownloadProgress({ stage, progress, message }: DownloadProgressProps) {
  const isComplete = stage === 'complete';
  const isError = stage === 'error';

  return (
    <div className="glass-card p-6 animate-fade-in-up">
      {/* 標題 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle className="text-green-600" size={24} />
          ) : isError ? (
            <XCircle className="text-red-600" size={24} />
          ) : (
            <Loader2 className="text-blue-600 animate-spin" size={24} />
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isComplete ? '下載完成' : isError ? '下載失敗' : '正在處理影片'}
          </h3>
        </div>
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {progress}%
        </span>
      </div>

      {/* 進度條 */}
      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 ease-out ${stageColors[stage]}`}
          style={{ width: `${progress}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
        </div>
      </div>

      {/* 階段指示器 */}
      <div className="flex justify-between mb-3">
        {Object.entries(stageNames).map(([key, name]) => {
          if (key === 'complete' || key === 'error') return null;

          const isActive = stage === key;
          const isPassed = ['info', 'download', 'subtitle', 'save'].indexOf(stage) >
                          ['info', 'download', 'subtitle', 'save'].indexOf(key);

          return (
            <div
              key={key}
              className={`text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : isPassed
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {name}
            </div>
          );
        })}
      </div>

      {/* 狀態訊息 */}
      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
        {!isComplete && !isError && (
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
        )}
        {message}
      </p>
    </div>
  );
}
