/**
 * TypeScript 類型定義
 */

export interface Video {
  id: number;
  youtube_id: string;
  title: string;
  channel: string;
  duration: number;
  thumbnail_url: string;
  video_path: string;
  folder_id?: number | null;
  created_at: string;
}

export interface Folder {
  id: number;
  name: string;
  color: string;
  created_at: string;
  video_count: number;
}

export interface SubtitleSegment {
  id: number;
  video_id: number;
  index: number;
  start_time: number;
  end_time: number;
  text_en: string;
  text_zh: string;
  letter_template: string;
  ai_insights?: string | null;
}

export interface LetterElement {
  type: 'input' | 'space' | 'punctuation';
  char: string;
  index?: number; // 僅 input 類型有 index
}

export interface Progress {
  videoId: string;
  lastSegmentIndex: number;
  completedSegments: number[];
  segmentScores: Record<number, number>;
}

export type PlayMode = 'loop' | 'once';

export type AIProvider = 'openai' | 'gemini' | 'ollama';

export interface AISettings {
  provider: AIProvider;
  openai_api_key_masked?: string | null;
  openai_model: string;
  gemini_api_key_masked?: string | null;
  gemini_model: string;
  ollama_base_url: string;
  ollama_model: string;
  updated_at?: string | null;
}

export interface AISettingsUpdate {
  provider: AIProvider;
  openai_api_key?: string;
  openai_model: string;
  gemini_api_key?: string;
  gemini_model: string;
  ollama_base_url: string;
  ollama_model: string;
}

export interface AIExplainRequest {
  text: string;
  context?: string;
}

export interface AIExplainResponse {
  explanation: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

