
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';

interface VideoControlsProps {
  isPlaying: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
}

const VideoControls = ({ 
  isPlaying, 
  isCompleted, 
  isLocked, 
  onPlayPause, 
  onRestart 
}: VideoControlsProps) => {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={onPlayPause}
        className="arabic-text"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {isPlaying ? 'إيقاف' : 'تشغيل'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onRestart}
        className="arabic-text"
        disabled={isLocked}
      >
        <RotateCcw className="h-4 w-4" />
        إعادة
      </Button>
      {isCompleted && (
        <Button
          size="sm"
          variant="outline"
          className="arabic-text bg-green-50 text-green-700"
          disabled
        >
          <CheckCircle className="h-4 w-4" />
          مكتمل
        </Button>
      )}
    </div>
  );
};

export default VideoControls;
