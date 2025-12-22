/**
 * AI 解說卡片元件
 */
import { Save, X } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';
import { subtitleApi } from '../services/api';
import { useState } from 'react';

export default function AIExplanationCard() {
  const {
    aiExplanation,
    showAIExplanation,
    toggleAIExplanation,
    setAIExplanation,
    segments,
    currentSegmentIndex,
    setSegments,
    isLoadingExplanation,
    setIsLoadingExplanation
  } = useVideoStore();

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedExplanation, setShowSavedExplanation] = useState(false);
  const currentSegment = segments[currentSegmentIndex];

  // 已保存的解說
  const savedExplanation = currentSegment?.ai_insights;
  // 是否有新生成的解說（未保存）
  const hasNewExplanation = showAIExplanation && aiExplanation;
  // 決定要顯示的內容：新生成的優先，否則顯示已保存的（如果用戶選擇顯示）
  const displayExplanation = hasNewExplanation ? aiExplanation : (showSavedExplanation ? savedExplanation : null);

  // 如果沒有任何解說可以顯示，不渲染
  if (!hasNewExplanation && !showSavedExplanation) {
    // 但如果有已保存的解說，顯示一個按鈕讓用戶展開
    if (savedExplanation) {
      return (
        <div className="mt-4">
          <button
            onClick={() => setShowSavedExplanation(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 text-purple-700 dark:text-purple-300 rounded-lg border-2 border-purple-300 dark:border-purple-600 font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>🤖</span>
            顯示已保存的 AI 解說
          </button>
        </div>
      );
    }
    return null;
  }

  const handleClose = () => {
    if (hasNewExplanation) {
      // 關閉新生成的解說
      toggleAIExplanation();
      setAIExplanation(null);
    } else {
      // 隱藏已保存的解說
      setShowSavedExplanation(false);
    }
  };

  const handleSave = async () => {
    if (!currentSegment || !aiExplanation || isSaving) return;

    setIsSaving(true);
    try {
      // 更新後端資料
      await subtitleApi.updateSegment(currentSegment.id, {
        ai_insights: aiExplanation
      });

      // 更新本地 state
      const updatedSegments = segments.map((seg, idx) =>
        idx === currentSegmentIndex
          ? { ...seg, ai_insights: aiExplanation }
          : seg
      );
      setSegments(updatedSegments);

      // 保存成功後，清除新生成的解說，改為顯示已保存的
      toggleAIExplanation();
      setAIExplanation(null);
      setShowSavedExplanation(true);
    } catch (error) {
      console.error('保存 AI 解說失敗:', error);
      alert('保存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentSegment || isLoadingExplanation) return;

    setIsLoadingExplanation(true);
    try {
      const { aiApi } = await import('../services/api');
      const response = await aiApi.explainSentence({
        text: currentSegment.text_en,
        context: ''
      });

      setAIExplanation(response.explanation);
      toggleAIExplanation(); // 確保 showAIExplanation 為 true
      setShowSavedExplanation(false); // 隱藏已保存的，顯示新生成的
    } catch (error) {
      console.error('重新生成 AI 解說失敗:', error);
      alert('重新生成失敗，請稍後再試');
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  return (
    <div className="mt-4 glass-card p-6 border-l-4 border-purple-500 animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-2">
          <span>🤖</span> AI 句子解說
          {!hasNewExplanation && showSavedExplanation && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
              已保存
            </span>
          )}
        </p>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          title={hasNewExplanation ? '關閉' : '隱藏'}
        >
          <X size={20} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
        </button>
      </div>

      {/* 解說內容 */}
      {displayExplanation && (
        <div className="mb-4 max-h-96 overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {/* 將換行符轉換為段落 */}
            {displayExplanation.split('\n').map((paragraph, index) => {
              // 處理標題（以 # 開頭）
              if (paragraph.startsWith('## ')) {
                return (
                  <h3 key={index} className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-6 mb-3">
                    {paragraph.replace('## ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('# ')) {
                return (
                  <h2 key={index} className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-6 mb-4">
                    {paragraph.replace('# ', '')}
                  </h2>
                );
              }

              // 處理列表項（以 - 或 * 或數字開頭）
              if (paragraph.match(/^[\-\*]\s+/)) {
                return (
                  <li key={index} className="text-gray-800 dark:text-gray-200 ml-4 mb-2">
                    {paragraph.replace(/^[\-\*]\s+/, '')}
                  </li>
                );
              }
              if (paragraph.match(/^\d+\.\s+/)) {
                return (
                  <li key={index} className="text-gray-800 dark:text-gray-200 ml-4 mb-2 list-decimal">
                  {paragraph.replace(/^\d+\.\s+/, '')}
                </li>
              );
            }

            // 處理粗體文字（**text** 或 __text__）
            const boldText = paragraph.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="text-amber-700 dark:text-yellow-300 font-bold">$1</strong>'
            ).replace(
              /__(.*?)__/g,
              '<strong class="text-amber-700 dark:text-yellow-300 font-bold">$1</strong>'
            );

            // 空行
            if (paragraph.trim() === '') {
              return <br key={index} />;
            }

            // 一般段落
            return (
              <p
                key={index}
                className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: boldText }}
              />
            );
          })}
          </div>
        </div>
      )}

      {/* 底部按鈕 */}
      <div className="flex gap-2">
        {hasNewExplanation ? (
          // 新生成的解說：顯示保存和關閉按鈕
          <>
            <button
              onClick={handleSave}
              disabled={isSaving || currentSegment?.ai_insights === aiExplanation}
              className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {isSaving ? '保存中...' : '保存 AI 解說'}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors duration-200"
            >
              關閉
            </button>
          </>
        ) : (
          // 已保存的解說：顯示重新生成和隱藏按鈕
          <>
            <button
              onClick={handleRegenerate}
              disabled={isLoadingExplanation}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              {isLoadingExplanation ? '生成中...' : '重新生成解說'}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors duration-200"
            >
              隱藏
            </button>
          </>
        )}
      </div>
    </div>
  );
}

