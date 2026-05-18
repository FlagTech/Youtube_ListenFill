/**
 * API 服務封裝
 */
import axios from 'axios';
import type { 
  Video, 
  SubtitleSegment, 
  Folder, 
  AISettings, 
  AISettingsUpdate, 
  AIExplainRequest, 
  AIExplainResponse,
  TestConnectionResponse 
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DownloadProgress {
  stage: 'info' | 'download' | 'subtitle' | 'save' | 'complete' | 'error';
  progress: number;
  message: string;
  video?: Video;
}

export const videoApi = {
  /**
   * 下載 YouTube 影片（使用 SSE 進度回報）
   */
  downloadVideoWithProgress: async (
    url: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<Video> => {
    return new Promise((resolve, reject) => {
      fetch(`${API_BASE_URL}/videos/download/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('下載請求失敗');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('無法讀取回應串流');
          }

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // 處理 SSE 格式的資料
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.substring(6));
                onProgress(data);

                if (data.stage === 'complete' && data.video) {
                  resolve(data.video);
                  return;
                } else if (data.stage === 'error') {
                  reject(new Error(data.message));
                  return;
                }
              }
            }
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  /**
   * 下載 YouTube 影片（舊版本，無進度回報）
   */
  downloadVideo: async (url: string): Promise<Video> => {
    const response = await api.post<Video>('/videos/download', { url });
    return response.data;
  },

  /**
   * 取得所有影片列表
   */
  getVideos: async (): Promise<Video[]> => {
    const response = await api.get<Video[]>('/videos');
    return response.data;
  },

  /**
   * 取得特定影片資訊
   */
  getVideo: async (videoId: number): Promise<Video> => {
    const response = await api.get<Video>(`/videos/${videoId}`);
    return response.data;
  },

  /**
   * 取得影片字幕分段
   */
  getSubtitles: async (videoId: number): Promise<SubtitleSegment[]> => {
    const response = await api.get<SubtitleSegment[]>(`/videos/${videoId}/subtitles`);
    return response.data;
  },

  /**
   * 取得影片串流 URL
   */
  getVideoStreamUrl: (videoId: number): string => {
    return `${API_BASE_URL}/videos/${videoId}/stream`;
  },

  /**
   * 刪除影片
   */
  deleteVideo: async (videoId: number): Promise<void> => {
    await api.delete(`/videos/${videoId}`);
  },
  
  /**
   * 移動影片到資料夾
   */
  moveVideoToFolder: async (videoId: number, folderId: number | null): Promise<Video> => {
    const response = await api.put<Video>(`/videos/${videoId}/folder`, { folder_id: folderId });
    return response.data;
  },
};

export const folderApi = {
  /**
   * 取得所有分類資料夾
   */
  getFolders: async (): Promise<Folder[]> => {
    const response = await api.get<Folder[]>('/folders');
    return response.data;
  },
  
  /**
   * 建立新分類資料夾
   */
  createFolder: async (name: string, color: string = '#6366f1'): Promise<Folder> => {
    const response = await api.post<Folder>('/folders', { name, color });
    return response.data;
  },
  
  /**
   * 更新分類資料夾
   */
  updateFolder: async (folderId: number, name: string, color: string): Promise<Folder> => {
    const response = await api.put<Folder>(`/folders/${folderId}`, { name, color });
    return response.data;
  },
  
  /**
   * 刪除分類資料夾
   */
  deleteFolder: async (folderId: number): Promise<void> => {
    await api.delete(`/folders/${folderId}`);
  },
  
  /**
   * 取得特定分類下的影片
   */
  getVideosByFolder: async (folderId: number): Promise<Video[]> => {
    const response = await api.get<Video[]>(`/folders/${folderId}/videos`);
    return response.data;
  },
};

export const aiApi = {
  /**
   * 取得 AI 設定
   */
  getSettings: async (): Promise<AISettings> => {
    const response = await api.get<AISettings>('/ai-settings');
    return response.data;
  },

  /**
   * 更新 AI 設定
   */
  updateSettings: async (settings: AISettingsUpdate): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/ai-settings', settings);
    return response.data;
  },

  /**
   * 測試 AI 服務連線
   */
  testConnection: async (): Promise<TestConnectionResponse> => {
    const response = await api.post<TestConnectionResponse>('/ai-settings/test');
    return response.data;
  },

  /**
   * 使用 AI 解說句子
   */
  explainSentence: async (request: AIExplainRequest): Promise<AIExplainResponse> => {
    const response = await api.post<AIExplainResponse>('/ai-explain', request);
    return response.data;
  },

  /**
   * 取得本地 Ollama 已安裝的模型列表
   */
  getOllamaModels: async (): Promise<string[]> => {
    const response = await api.get<{ models: string[] }>('/ai-settings/ollama-models');
    return response.data.models;
  },
};

export const subtitleApi = {
  /**
   * 更新字幕片段（例如保存 AI 解說）
   */
  updateSegment: async (segmentId: number, data: { ai_insights?: string }): Promise<void> => {
    await api.put(`/subtitles/${segmentId}`, data);
  },
};

