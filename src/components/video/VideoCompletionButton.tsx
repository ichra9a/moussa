
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

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
  if (isCompleted) return null;

  if (watchedSufficientTime) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-green-800 arabic-text">جاهز لتحديد الفيديو كمكتمل؟</h4>
            <p className="text-sm text-green-600 arabic-text mt-1">
              لقد شاهدت ما يكفي من الفيديو. اضغط لتحديده كمكتمل والانتقال للخطوة التالية.
            </p>
          </div>
          <Button
            onClick={onMarkAsComplete}
            className="bg-green-600 hover:bg-green-700 text-white arabic-text"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            تحديد كمكتمل
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p className="text-blue-700 arabic-text text-sm">
        شاهد 70% على الأقل من الفيديو لتتمكن من تحديده كمكتمل
      </p>
    </div>
  );
};

export default VideoCompletionButton;
