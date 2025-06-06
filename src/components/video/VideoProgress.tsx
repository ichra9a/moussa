
import { Progress } from '@/components/ui/progress';

interface VideoProgressProps {
  completionPercentage: number;
  currentTime: number;
  duration: number;
  watchTime: number;
}

const VideoProgress = ({ 
  completionPercentage, 
  currentTime, 
  duration, 
  watchTime 
}: VideoProgressProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="arabic-text">التقدم</span>
        <span>{completionPercentage}%</span>
      </div>
      <Progress value={completionPercentage} className="h-2" />
      <div className="flex justify-between text-sm text-gray-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div className="text-sm text-gray-500 arabic-text">
        وقت المشاهدة: {formatTime(watchTime)}
      </div>
    </div>
  );
};

export default VideoProgress;
