
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Trophy, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ModuleCompletionCardProps {
  moduleTitle: string;
  totalVideos: number;
  completedVideos: number;
  isModuleCompleted: boolean;
  canCompleteModule: boolean;
  onCompleteModule: () => void;
}

const ModuleCompletionCard = ({
  moduleTitle,
  totalVideos,
  completedVideos,
  isModuleCompleted,
  canCompleteModule,
  onCompleteModule
}: ModuleCompletionCardProps) => {
  if (isModuleCompleted) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-yellow-500" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 arabic-heading">
                تهانينا! أكملت هذه الوحدة
              </h3>
              <p className="text-sm text-green-700 arabic-text">
                لقد أكملت جميع فيديوهات "{moduleTitle}" بنجاح
              </p>
            </div>
            <Badge className="bg-green-600 text-white">
              مكتملة
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.round((completedVideos / totalVideos) * 100);

  return (
    <Card className={`${canCompleteModule 
      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
      : 'bg-gray-50 border-gray-200'
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg arabic-heading flex items-center gap-2">
          <Trophy className="h-5 w-5 text-blue-600" />
          إتمام الوحدة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm arabic-text">التقدم في الوحدة</span>
            <span className="text-sm font-medium">{completedVideos}/{totalVideos} فيديو</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 arabic-text">
            {progressPercentage}% مكتمل
          </p>
        </div>

        {canCompleteModule ? (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 arabic-text text-sm">
                🎉 ممتاز! لقد أكملت جميع فيديوهات هذه الوحدة. 
                يمكنك الآن تحديد الوحدة كمكتملة للانتقال للوحدة التالية.
              </p>
            </div>
            <Button
              onClick={onCompleteModule}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white arabic-text"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              تحديد الوحدة كمكتملة
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600 arabic-text text-sm">
              أكمل مشاهدة جميع فيديوهات الوحدة والإجابة على أسئلة التحقق لتتمكن من تحديد الوحدة كمكتملة
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleCompletionCard;
