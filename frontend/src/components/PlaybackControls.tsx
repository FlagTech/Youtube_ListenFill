/**
 * 播放控制元件
 */
import { useVideoStore } from '../store/useVideoStore';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlaybackControls() {
  const { playMode, playbackSpeed, setPlayMode, setPlaybackSpeed, triggerSeek, setIsPlaying } = useVideoStore();

  const handleSelectMode = (mode: 'loop' | 'once') => {
    setPlayMode(mode);
    triggerSeek();
    setIsPlaying(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      {/* 播放速度控制 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-700">播放速度控制</h3>
        <div className="flex flex-wrap gap-2">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>

      {/* 播放模式切換 */}
      <div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSelectMode('loop')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              playMode === 'loop'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            循環
          </button>
          <button
            onClick={() => handleSelectMode('once')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              playMode === 'once'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            單次
          </button>
        </div>
      </div>
    </div>
  );
}

