/**
 * 填空輸入元件
 */
import { useRef, useEffect, KeyboardEvent } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { parseLetterTemplate, extractCorrectAnswers, checkAnswers } from '../utils/letterParser';

export default function FillBlanksInput() {
  const {
    segments,
    currentSegmentIndex,
    userInputs,
    showAnswer,
    updateUserInput,
  } = useVideoStore();
  
  const currentSegment = segments[currentSegmentIndex];
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  if (!currentSegment) {
    return <div className="text-center text-gray-500 py-8">請選擇一個段落</div>;
  }
  
  const elements = parseLetterTemplate(currentSegment.letter_template);
  const correctAnswers = extractCorrectAnswers(elements);
  const currentInputs = userInputs[currentSegmentIndex] || [];
  const answerCheck = showAnswer ? checkAnswers(currentInputs, correctAnswers) : [];
  
  // 自動聚焦到第一個輸入框
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [currentSegmentIndex]);
  
  const handleInputChange = (index: number, value: string) => {
    // 只允許輸入字母
    const letter = value.replace(/[^a-zA-Z]/g, '').slice(-1);
    
    updateUserInput(currentSegmentIndex, index, letter);
    
    // 自動跳到下一個輸入框
    if (letter && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    const input = e.currentTarget;
    
    if (e.key === 'Backspace' && !input.value && index > 0) {
      // 空白時按退格，返回上一個輸入框
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // 左箭頭
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < inputRefs.current.length - 1) {
      // 右箭頭
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const getInputClassName = (index: number): string => {
    let className = 'input-box';
    
    if (showAnswer && answerCheck[index]) {
      if (answerCheck[index].isEmpty) {
        className += ' border-gray-300';
      } else if (answerCheck[index].isCorrect) {
        className += ' correct';
      } else {
        className += ' incorrect';
      }
    }
    
    return className;
  };
  
  return (
    <div className="space-y-4">
      {/* 填空輸入區 */}
      <div className="flex flex-wrap gap-1 items-baseline p-6 bg-white rounded-lg shadow-md min-h-32">
        {elements.map((element, idx) => {
          if (element.type === 'input') {
            const inputIndex = element.index!;
            return (
              <input
                key={`input-${idx}`}
                ref={(el) => (inputRefs.current[inputIndex] = el)}
                type="text"
                maxLength={1}
                value={currentInputs[inputIndex] || ''}
                onChange={(e) => handleInputChange(inputIndex, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, inputIndex)}
                className={getInputClassName(inputIndex)}
                autoComplete="off"
              />
            );
          } else if (element.type === 'space') {
            return (
              <span key={`space-${idx}`} className="inline-block w-4" />
            );
          } else {
            // 標點符號
            return (
              <span key={`punct-${idx}`} className="inline-flex justify-center text-lg font-medium text-gray-700" style={{ width: '1.4ch' }}>
                {element.char}
              </span>
            );
          }
        })}
      </div>
      
      {/* 正確答案顯示 */}
      {showAnswer && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">正確答案：</p>
          <div className="flex flex-wrap gap-1 items-baseline">
            {elements.map((element, idx) => {
              if (element.type === 'input') {
                const inputIndex = element.index!;
                const check = answerCheck[inputIndex];
                return (
                  <span
                    key={`answer-${idx}`}
                    className={`h-8 inline-flex items-center justify-center text-lg font-medium border-b-2 ${
                      check.isEmpty
                        ? 'border-gray-400 text-gray-600'
                        : check.isCorrect
                        ? 'border-green-500 text-green-700'
                        : 'border-red-500 text-red-700'
                    }`}
                    style={{ width: '1.4ch' }}
                  >
                    {element.char}
                  </span>
                );
              } else if (element.type === 'space') {
                return <span key={`answer-space-${idx}`} className="inline-block w-4" />;
              } else {
                return (
                  <span key={`answer-punct-${idx}`} className="inline-flex justify-center text-lg font-medium text-gray-700" style={{ width: '1.4ch' }}>
                    {element.char}
                  </span>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}

