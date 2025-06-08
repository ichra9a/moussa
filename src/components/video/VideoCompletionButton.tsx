
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';

interface VideoCompletionButtonProps {
  watchedSufficientTime: boolean;
  isCompleted: boolean;
  onMarkAsComplete: () => void;
}

const VideoCompletionButton = ({ 
  watchedSufficientTime, 
  isCompleted, 
  onMarkAsComplete 
}: VideoCompletionButtonProps) => {
  if (isCompleted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800 arabic-text">
            تم إكمال هذا الفيديو ✓
          </span>
        </div>
      </div>
    );
  }

  if (watchedSufficientTime) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h4 className="font-semibold text-green-800 arabic-text">
              جاهز لتحديد الفيديو كمكتمل؟
            </h4>
          </div>
          <p className="text-sm text-green-700 arabic-text">
            لقد شاهدت ما يكفي من الفيديو. اضغط لتحديده كمكتمل والانتقال للخطوة التالية.
          </p>
          <Button
            onClick={onMarkAsComplete}
            className="w-full bg-green-600 hover:bg-green-700 text-white arabic-text"
            size="lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            تحديد الفيديو كمكتمل
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-center gap-2">
        <Clock className="h-5 w-5 text-blue-600" />
        <p className="text-blue-700 arabic-text text-center">
          شاهد 70% على الأقل من الفيديو لتتمكن من تحديده كمكتمل
        </p>
      </div>
    </div>
  );
};

export default VideoCompletionButton;
