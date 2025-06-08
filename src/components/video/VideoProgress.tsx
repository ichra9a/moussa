
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';

interface VideoProgressProps {
  completionPercentage: number;
  currentTime: number;
  duration: number;
  watchTime: number;
  maxPreviewTime?: number;
}

const VideoProgress = ({ 
  completionPercentage, 
  currentTime, 
  duration, 
  watchTime,
  maxPreviewTime 
}: VideoProgressProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const effectiveDuration = maxPreviewTime ? Math.min(maxPreviewTime, duration) : duration;
  const progressColor = maxPreviewTime ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Clock size={14} />
          <span className="arabic-text">التقدم</span>
        </div>
        <span>{completionPercentage}%</span>
      </div>
      
      <Progress value={completionPercentage} className="h-2" />
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatTime(currentTime)}</span>
        <div className="flex items-center gap-2">
          {maxPreviewTime && (
            <span className="text-amber-600 arabic-text">
              معاينة: {formatTime(maxPreviewTime)}
            </span>
          )}
          <span>{formatTime(effectiveDuration)}</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 arabic-text">
        وقت المشاهدة الإجمالي: {Math.floor(watchTime / 60)} دقيقة
      </div>
    </div>
  );
};

export default VideoProgress;
