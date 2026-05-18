/**
 * 填空輸入元件
 */
import { useRef, useEffect, useCallback, useMemo, KeyboardEvent } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { parseLetterTemplate, extractCorrectAnswers, checkAnswers } from '../utils/letterParser';

export default function FillBlanksInput() {
  const segments = useVideoStore(state => state.segments);
  const currentSegmentIndex = useVideoStore(state => state.currentSegmentIndex);
  const userInputs = useVideoStore(state => state.userInputs);
  const showAnswer = useVideoStore(state => state.showAnswer);
  const pendingFocusIndex = useVideoStore(state => state.pendingFocusIndex);
  const updateUserInput = useVideoStore(state => state.updateUserInput);
  const setPendingFocusIndex = useVideoStore(state => state.setPendingFocusIndex);

  const currentSegment = segments[currentSegmentIndex];
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const elements = useMemo(
    () => (currentSegment ? parseLetterTemplate(currentSegment.letter_template) : []),
    [currentSegment?.letter_template]
  );

  const correctAnswers = useMemo(() => extractCorrectAnswers(elements), [elements]);

  const currentInputs = userInputs[currentSegmentIndex] || [];

  const answerCheck = useMemo(
    () => (showAnswer ? checkAnswers(currentInputs, correctAnswers) : []),
    [showAnswer, currentInputs, correctAnswers]
  );

  // 切換分段時聚焦第一個輸入框
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [currentSegmentIndex]);

  // hint 填字後，render 完成再用 ref 聚焦（避免 ref 還是 null 的時序問題）
  useEffect(() => {
    if (pendingFocusIndex === null) return;
    inputRefs.current[pendingFocusIndex]?.focus();
    setPendingFocusIndex(null);
  }, [pendingFocusIndex, setPendingFocusIndex]);

  // 穩定的 ref 設定函式，避免每次 render 建立新 function 觸發 ref 清空再重設
  const setInputRef = useCallback(
    (inputIndex: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[inputIndex] = el;
    },
    []
  );

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const letter = value.replace(/[^a-zA-Z]/g, '').slice(-1);
      updateUserInput(currentSegmentIndex, index, letter);

      if (letter && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [currentSegmentIndex, updateUserInput]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, index: number) => {
      const input = e.currentTarget;

      if (e.key === 'Backspace') {
        if (!input.value && index > 0) {
          e.preventDefault();
          updateUserInput(currentSegmentIndex, index - 1, '');
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && inputRefs.current[index + 1]) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    },
    [currentSegmentIndex, updateUserInput]
  );

  const getInputClassName = useCallback(
    (index: number): string => {
      if (!showAnswer || !answerCheck[index]) return 'input-box';
      const { isEmpty, isCorrect } = answerCheck[index];
      if (isEmpty) return 'input-box border-gray-300';
      return isCorrect ? 'input-box correct' : 'input-box incorrect';
    },
    [showAnswer, answerCheck]
  );

  if (!currentSegment) {
    return <div className="text-center text-gray-500 py-8">請選擇一個段落</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 items-baseline p-6 bg-white rounded-lg shadow-md min-h-32 font-mono">
        {elements.map((element, idx) => {
          if (element.type === 'input') {
            const inputIndex = element.index!;
            return (
              <input
                key={`input-${idx}`}
                ref={setInputRef(inputIndex)}
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
            return <span key={`space-${idx}`} className="inline-block w-4" />;
          } else {
            return (
              <span key={`punct-${idx}`} className="inline-flex justify-center text-lg font-medium text-gray-700" style={{ width: '1.4ch' }}>
                {element.char}
              </span>
            );
          }
        })}
      </div>

      {showAnswer && (
        <div className="py-4 px-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">正確答案：</p>
          <div className="flex flex-wrap gap-1 items-baseline font-mono">
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
