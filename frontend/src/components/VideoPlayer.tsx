/**
 * 影片播放器元件
 */
import { useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';

interface VideoPlayerProps {
  videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    segments,
    currentSegmentIndex,
    playMode,
    playbackSpeed,
    isPlaying,
    seekTrigger,
    setIsPlaying,
    nextSegment,
    prevSegment,
  } = useVideoStore();
  
  const currentSegment = segments[currentSegmentIndex];
  
  // 跳轉到當前段落
  useEffect(() => {
    if (currentSegment && playerRef.current) {
      playerRef.current.seekTo(currentSegment.start_time, 'seconds');
    }
  }, [currentSegmentIndex, currentSegment]);

  // 點擊循環/單次按鈕時強制 seek 到當前分段並開始播放
  useEffect(() => {
    if (seekTrigger === 0) return;
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    if (currentSegment && playerRef.current) {
      playerRef.current.seekTo(currentSegment.start_time, 'seconds');
      setIsPlaying(true);
    }
  }, [seekTrigger]);
  
  // 處理播放進度
  const handleProgress = (state: { playedSeconds: number }) => {
    if (!currentSegment) return;
    
    // 檢查是否超過當前段落結束時間
    if (state.playedSeconds >= currentSegment.end_time) {
      if (playMode === 'loop') {
        // 循環模式：暫停 2 秒後重播
        setIsPlaying(false);
        
        if (loopTimeoutRef.current) {
          clearTimeout(loopTimeoutRef.current);
        }
        
        loopTimeoutRef.current = setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.seekTo(currentSegment.start_time, 'seconds');
            setIsPlaying(true);
          }
        }, 2000);
      } else {
        // 單次模式：暫停
        setIsPlaying(false);
        if (playerRef.current) {
          playerRef.current.seekTo(currentSegment.start_time, 'seconds');
        }
      }
    }
  };
  
  // 清理定時器
  useEffect(() => {
    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
    };
  }, []);
  
  const handlePrevSegment = () => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
    }
    prevSegment();
  };
  
  const handleNextSegment = () => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
    }
    nextSegment();
  };
  
  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
      {/* 左箭頭 */}
      <button
        onClick={handlePrevSegment}
        disabled={currentSegmentIndex === 0}
        className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        title="上一段"
      >
        <ChevronLeft size={32} />
      </button>
      
      {/* 影片播放器 */}
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={isPlaying}
        playbackRate={playbackSpeed}
        onProgress={handleProgress}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controls
        width="100%"
        height="100%"
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
            },
          },
        }}
      />
      
      {/* 右箭頭 */}
      <button
        onClick={handleNextSegment}
        disabled={currentSegmentIndex === segments.length - 1}
        className="absolute right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        title="下一段"
      >
        <ChevronRight size={32} />
      </button>
    </div>
  );
}

