/**
 * 字母模板解析工具
 */
import type { LetterElement } from '../types';

/**
 * 解析字母模板為元素陣列
 * 
 * @param template - 字母模板（例如："H|e|l|l|o|,| |w|o|r|l|d|!"）
 * @returns 元素陣列
 */
export function parseLetterTemplate(template: string): LetterElement[] {
  if (!template) return [];
  
  const chars = template.split('|');
  const elements: LetterElement[] = [];
  let inputIndex = 0;
  
  for (const char of chars) {
    if (char.match(/[a-zA-Z]/)) {
      // 字母 -> 輸入框
      elements.push({
        type: 'input',
        char: char,
        index: inputIndex++,
      });
    } else if (char === ' ') {
      // 空格
      elements.push({
        type: 'space',
        char: ' ',
      });
    } else {
      // 標點符號
      elements.push({
        type: 'punctuation',
        char: char,
      });
    }
  }
  
  return elements;
}

/**
 * 從元素陣列提取正確答案（僅字母）
 * 
 * @param elements - 元素陣列
 * @returns 正確答案陣列
 */
export function extractCorrectAnswers(elements: LetterElement[]): string[] {
  return elements
    .filter(el => el.type === 'input')
    .map(el => el.char);
}

/**
 * 檢查答案正確性
 * 
 * @param userInputs - 使用者輸入
 * @param correctAnswers - 正確答案
 * @returns 檢查結果陣列
 */
export function checkAnswers(
  userInputs: string[],
  correctAnswers: string[]
): { isCorrect: boolean; isEmpty: boolean }[] {
  return correctAnswers.map((correct, idx) => {
    const input = userInputs[idx] || '';
    return {
      isCorrect: input.toLowerCase() === correct.toLowerCase(),
      isEmpty: input.trim() === '',
    };
  });
}

