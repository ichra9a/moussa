
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, BookOpen, Lock, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  videos: any[];
}

interface CourseProgressProps {
  modules: Module[];
  overallProgress: number;
  completedModules: number;
  completedVideos: number;
  totalVideos: number;
  isModuleCompleted: (module: Module) => boolean;
  isModuleUnlocked: (moduleIndex: number) => boolean;
  getModuleProgress: (module: Module) => number;
}

const CourseProgress = ({ 
  modules, 
  overallProgress, 
  completedModules, 
  completedVideos, 
  totalVideos,
  isModuleCompleted,
  isModuleUnlocked,
  getModuleProgress
}: CourseProgressProps) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">تقدمك في الدورة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="arabic-text">التقدم الإجمالي</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="arabic-text">المودولات المكتملة</span>
                <span>{completedModules} من {modules.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="arabic-text">الفيديوهات المكتملة</span>
                <span>{completedVideos} من {totalVideos}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">المودولات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isModuleUnlocked(index) 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isModuleCompleted(module) ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : isModuleUnlocked(index) ? (
                    <BookOpen size={16} className="text-blue-500" />
                  ) : (
                    <Lock size={16} className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium arabic-text">
                    {module.title}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {getModuleProgress(module)}% مكتمل
                </div>
                <Progress value={getModuleProgress(module)} className="h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseProgress;
