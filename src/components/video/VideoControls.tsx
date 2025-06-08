
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, CheckCircle, Lock } from 'lucide-react';

interface VideoControlsProps {
  isPlaying: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  previewEnded?: boolean;
}

const VideoControls = ({ 
  isPlaying, 
  isCompleted, 
  isLocked, 
  onPlayPause, 
  onRestart,
  previewEnded = false
}: VideoControlsProps) => {
  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onPlayPause}
        disabled={isLocked || previewEnded}
        variant={isLocked || previewEnded ? "secondary" : "default"}
        size="sm"
        className="flex items-center gap-2"
      >
        {isLocked ? (
          <Lock size={16} />
        ) : previewEnded ? (
          <Lock size={16} />
        ) : isPlaying ? (
          <Pause size={16} />
        ) : (
          <Play size={16} />
        )}
        <span className="arabic-text">
          {isLocked ? 'مقفل' : previewEnded ? 'انتهت المعاينة' : isPlaying ? 'إيقاف' : 'تشغيل'}
        </span>
      </Button>

      <Button
        onClick={onRestart}
        disabled={isLocked}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RotateCcw size={16} />
        <span className="arabic-text">إعادة التشغيل</span>
      </Button>

      {isCompleted && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle size={16} />
          <span className="text-sm arabic-text">مكتمل</span>
        </div>
      )}
    </div>
  );
};

export default VideoControls;
