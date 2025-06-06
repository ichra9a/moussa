
import { Button } from '@/components/ui/button';
import { CheckCircle, Trophy } from 'lucide-react';

interface ModuleCompletionProps {
  onComplete: () => void;
}

const ModuleCompletion = ({ onComplete }: ModuleCompletionProps) => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h3 className="font-semibold text-green-800 arabic-heading">
          هل أكملت مشاهدة جميع فيديوهات هذه الوحدة؟
        </h3>
      </div>
      
      <p className="text-sm text-green-700 arabic-text mb-4">
        بعد تحديد الوحدة كمكتملة، ستتمكن من الوصول للوحدة التالية
      </p>
      
      <Button
        onClick={onComplete}
        className="w-full bg-green-600 hover:bg-green-700 text-white arabic-text"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        نعم، أكملت هذه الوحدة
      </Button>
    </div>
  );
};

export default ModuleCompletion;
