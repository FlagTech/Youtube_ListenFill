/**
 * 動作按鈕元件
 */
import { Lightbulb, CheckCircle, Languages, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { parseLetterTemplate, extractCorrectAnswers } from '../utils/letterParser';
import { aiApi } from '../services/api';

export default function ActionButtons() {
  const {
    segments,
    currentSegmentIndex,
    currentVideo,
    userInputs,
    showAnswer,
    showTranslation,
    isLoadingExplanation,
    updateUserInput,
    setPendingFocusIndex,
    toggleShowAnswer,
    toggleShowTranslation,
    setAIExplanation,
    toggleAIExplanation,
    setIsLoadingExplanation,
  } = useVideoStore();
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const currentSegment = segments[currentSegmentIndex];
  
  if (!currentSegment) return null;
  
  const elements = parseLetterTemplate(currentSegment.letter_template);
  const correctAnswers = extractCorrectAnswers(elements);
  const currentInputs = userInputs[currentSegmentIndex] || [];
  
  /**
   * 給我提示：找到第一個空白或錯誤的輸入框，填入正確字母
   */
  const handleGiveHint = () => {
    for (let i = 0; i < correctAnswers.length; i++) {
      const userInput = currentInputs[i] || '';
      const correctAnswer = correctAnswers[i];

      if (!userInput || userInput.toLowerCase() !== correctAnswer.toLowerCase()) {
        updateUserInput(currentSegmentIndex, i, correctAnswer);
        // 透過 store 通知 FillBlanksInput 在 render 完成後聚焦 i+1
        setPendingFocusIndex(i + 1);
        break;
      }
    }
  };
  
  /**
   * 檢查答案：顯示/隱藏正確答案
   */
  const handleCheckAnswer = () => {
    toggleShowAnswer();
  };
  
  /**
   * 顯示翻譯：切換翻譯顯示
   */
  const handleToggleTranslation = () => {
    toggleShowTranslation();
  };
  
  /**
   * AI 解說：呼叫 AI 服務解說當前句子
   */
  const handleAIExplain = async () => {
    if (isLoadingExplanation) return;
    
    setErrorMessage(null);
    setIsLoadingExplanation(true);
    
    try {
      const response = await aiApi.explainSentence({
        text: currentSegment.text_en,
        context: currentVideo?.title || ''
      });
      
      setAIExplanation(response.explanation);
      toggleAIExplanation();
    } catch (error: any) {
      // 處理錯誤
      if (error.response?.status === 400) {
        setErrorMessage(error.response.data.detail || '請先到設定頁面配置 AI 服務');
      } else {
        setErrorMessage('AI 解說失敗，請稍後再試');
      }
      
      // 3 秒後清除錯誤訊息
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoadingExplanation(false);
    }
  };
  
  return (
    <div className="space-y-3">
      {/* 錯誤訊息 */}
      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm animate-fade-in">
          {errorMessage}
        </div>
      )}
      
      <button
        onClick={handleGiveHint}
        className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-amber-600 active:bg-amber-700 transition-colors duration-200"
        title="顯示下一個字母提示"
      >
        <Lightbulb size={20} />
        <span>給我提示</span>
      </button>

      <button
        onClick={handleToggleTranslation}
        className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${
          showTranslation
            ? 'bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700'
            : 'bg-purple-100 text-purple-700 hover:bg-purple-200 active:bg-purple-300'
        }`}
        title="顯示/隱藏中文翻譯"
      >
        <Languages size={20} />
        <span>{showTranslation ? '隱藏翻譯' : '顯示翻譯'}</span>
      </button>

      <button
        onClick={handleCheckAnswer}
        className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${
          showAnswer
            ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700'
            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:bg-emerald-300'
        }`}
        title="檢查答案正確性"
      >
        <CheckCircle size={20} />
        <span>{showAnswer ? '隱藏答案' : '檢查答案'}</span>
      </button>

      <button
        onClick={handleAIExplain}
        disabled={isLoadingExplanation}
        className="w-full px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-violet-600 hover:to-purple-700 active:from-violet-700 active:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="使用 AI 解說這個句子"
      >
        <Sparkles size={20} className={isLoadingExplanation ? 'animate-spin' : ''} />
        <span>{isLoadingExplanation ? '解說中...' : 'AI 解說'}</span>
      </button>
    </div>
  );
}

