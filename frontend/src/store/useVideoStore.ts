/**
 * Zustand 狀態管理
 */
import { create } from 'zustand';
import type { Video, SubtitleSegment, PlayMode, Progress, Folder } from '../types';

interface VideoStore {
  // 影片相關
  videos: Video[];
  currentVideo: Video | null;
  
  // 字幕分段
  segments: SubtitleSegment[];
  currentSegmentIndex: number;
  
  // 播放控制
  playMode: PlayMode;
  playbackSpeed: number;
  isPlaying: boolean;
  seekTrigger: number; // 每次遞增觸發 VideoPlayer seek 到當前分段
  
  // 填空狀態
  userInputs: Record<number, string[]>; // segmentIndex -> 字母陣列
  showAnswer: boolean;
  showTranslation: boolean;
  pendingFocusIndex: number | null; // hint 後需要聚焦的 inputIndex
  
  // 分類資料夾
  folders: Folder[];
  selectedFolderId: number | null; // null 表示顯示全部，0 表示未分類
  
  // 側邊欄
  sidebarOpen: boolean;
  
  // AI 解說
  aiExplanation: string | null;
  showAIExplanation: boolean;
  isLoadingExplanation: boolean;
  
  // Actions - 影片管理
  setVideos: (videos: Video[]) => void;
  setCurrentVideo: (video: Video | null) => void;
  addVideo: (video: Video) => void;
  removeVideo: (videoId: number) => void;
  updateVideo: (video: Video) => void;
  
  // Actions - 字幕管理
  setSegments: (segments: SubtitleSegment[]) => void;
  setCurrentSegmentIndex: (index: number) => void;
  nextSegment: () => void;
  prevSegment: () => void;
  
  // Actions - 播放控制
  togglePlayMode: () => void;
  setPlayMode: (mode: PlayMode) => void;
  setPlaybackSpeed: (speed: number) => void;
  setIsPlaying: (playing: boolean) => void;
  triggerSeek: () => void;
  
  // Actions - 填空練習
  updateUserInput: (segmentIndex: number, letterIndex: number, value: string) => void;
  toggleShowAnswer: () => void;
  toggleShowTranslation: () => void;
  setPendingFocusIndex: (index: number | null) => void;

  // Actions - 進度管理
  saveProgress: () => void;
  loadProgress: (videoId: string) => void;
  
  // Actions - 分類管理
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (folder: Folder) => void;
  removeFolder: (folderId: number) => void;
  setSelectedFolderId: (folderId: number | null) => void;
  
  // Actions - 側邊欄
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Actions - AI 解說
  setAIExplanation: (explanation: string | null) => void;
  toggleAIExplanation: () => void;
  setIsLoadingExplanation: (loading: boolean) => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  // 初始狀態
  videos: [],
  currentVideo: null,
  segments: [],
  currentSegmentIndex: 0,
  playMode: 'loop',
  playbackSpeed: 1,
  isPlaying: false,
  seekTrigger: 0,
  userInputs: {},
  showAnswer: false,
  showTranslation: false,
  pendingFocusIndex: null,
  folders: [],
  selectedFolderId: null,
  sidebarOpen: false,
  aiExplanation: null,
  showAIExplanation: false,
  isLoadingExplanation: false,
  
  // 影片管理
  setVideos: (videos) => set({ videos }),
  
  setCurrentVideo: (video) => {
    set({ 
      currentVideo: video,
      currentSegmentIndex: 0,
      userInputs: {},
      showAnswer: false,
      showTranslation: false,
    });
    
    // 載入進度
    if (video) {
      get().loadProgress(video.youtube_id);
    }
  },
  
  addVideo: (video) => set((state) => ({
    videos: [video, ...state.videos]
  })),
  
  removeVideo: (videoId) => set((state) => ({
    videos: state.videos.filter(v => v.id !== videoId)
  })),
  
  updateVideo: (video) => set((state) => ({
    videos: state.videos.map(v => v.id === video.id ? video : v)
  })),
  
  // 字幕管理
  setSegments: (segments) => set({ segments }),
  
  setCurrentSegmentIndex: (index) => {
    const { segments } = get();
    if (index >= 0 && index < segments.length) {
      set({
        currentSegmentIndex: index,
        showAnswer: false,
        isPlaying: true, // 自動開始播放
        aiExplanation: null,
        showAIExplanation: false,
      });
    }
  },

  nextSegment: () => {
    const { currentSegmentIndex, segments } = get();
    if (currentSegmentIndex < segments.length - 1) {
      set({
        currentSegmentIndex: currentSegmentIndex + 1,
        showAnswer: false,
        aiExplanation: null,
        showAIExplanation: false,
      });
    }
  },

  prevSegment: () => {
    const { currentSegmentIndex } = get();
    if (currentSegmentIndex > 0) {
      set({
        currentSegmentIndex: currentSegmentIndex - 1,
        showAnswer: false,
        aiExplanation: null,
        showAIExplanation: false,
      });
    }
  },
  
  // 播放控制
  togglePlayMode: () => set((state) => ({
    playMode: state.playMode === 'loop' ? 'once' : 'loop'
  })),

  setPlayMode: (mode) => set({ playMode: mode }),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  triggerSeek: () => set((state) => ({ seekTrigger: state.seekTrigger + 1 })),
  
  // 填空練習
  updateUserInput: (segmentIndex, letterIndex, value) => {
    const { userInputs } = get();
    const currentInputs = userInputs[segmentIndex] || [];
    const newInputs = [...currentInputs];
    newInputs[letterIndex] = value;
    
    set({
      userInputs: {
        ...userInputs,
        [segmentIndex]: newInputs
      }
    });
  },
  
  toggleShowAnswer: () => set((state) => ({
    showAnswer: !state.showAnswer
  })),

  toggleShowTranslation: () => set((state) => ({
    showTranslation: !state.showTranslation
  })),

  setPendingFocusIndex: (index) => set({ pendingFocusIndex: index }),
  
  // 進度管理
  saveProgress: () => {
    const { currentVideo, currentSegmentIndex } = get();
    if (!currentVideo) return;

    const progress: Progress = {
      videoId: currentVideo.youtube_id,
      lastSegmentIndex: currentSegmentIndex,
    };

    localStorage.setItem(
      `progress_${currentVideo.youtube_id}`,
      JSON.stringify(progress)
    );
  },

  loadProgress: (videoId) => {
    const saved = localStorage.getItem(`progress_${videoId}`);
    if (saved) {
      try {
        const progress: Progress = JSON.parse(saved);
        set({ currentSegmentIndex: progress.lastSegmentIndex || 0 });
      } catch (e) {
        console.error('載入進度失敗:', e);
      }
    }
  },
  
  // 分類管理
  setFolders: (folders) => set({ folders }),
  
  addFolder: (folder) => set((state) => ({
    folders: [folder, ...state.folders]
  })),
  
  updateFolder: (folder) => set((state) => ({
    folders: state.folders.map(f => f.id === folder.id ? folder : f)
  })),
  
  removeFolder: (folderId) => set((state) => ({
    folders: state.folders.filter(f => f.id !== folderId),
    selectedFolderId: state.selectedFolderId === folderId ? null : state.selectedFolderId
  })),
  
  setSelectedFolderId: (folderId) => set({ selectedFolderId: folderId }),
  
  // 側邊欄
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // AI 解說
  setAIExplanation: (explanation) => set({ aiExplanation: explanation }),
  
  toggleAIExplanation: () => set((state) => ({ 
    showAIExplanation: !state.showAIExplanation 
  })),
  
  setIsLoadingExplanation: (loading) => set({ isLoadingExplanation: loading }),
}));

