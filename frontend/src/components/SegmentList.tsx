/**
 * 字幕分段列表元件
 */
import { Check } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';

export default function SegmentList() {
  const { segments, currentSegmentIndex, setCurrentSegmentIndex, userInputs } = useVideoStore();
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const isSegmentCompleted = (index: number): boolean => {
    const inputs = userInputs[index];
    if (!inputs || inputs.length === 0) return false;
    const template = segments[index]?.letter_template;
    if (!template) return false;
    const expectedCount = template.split('|').filter(c => /[a-zA-Z]/.test(c)).length;
    if (expectedCount === 0) return false;
    const filledCount = inputs.filter(v => v && v.trim() !== '').length;
    return filledCount >= expectedCount;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">字幕分段列表</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {segments.map((segment, index) => (
          <div
            key={segment.id}
            onClick={() => setCurrentSegmentIndex(index)}
            className={`segment-item ${
              index === currentSegmentIndex ? 'active' : ''
            } ${isSegmentCompleted(index) ? 'completed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
              </span>
              {isSegmentCompleted(index) && (
                <Check size={16} className="text-green-600" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

