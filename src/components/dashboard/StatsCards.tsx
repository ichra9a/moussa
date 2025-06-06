
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  totalStudents: number;
  totalCourses: number;
  completedModules: number;
  averageProgress: number;
}

const StatsCards = ({ totalStudents, totalCourses, completedModules, averageProgress }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 arabic-text">إجمالي الطلاب</p>
              <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 arabic-text">الدورات المتاحة</p>
              <p className="text-2xl font-bold text-slate-900">{totalCourses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 arabic-text">المودولات المكتملة</p>
              <p className="text-2xl font-bold text-slate-900">{completedModules}</p>
            </div>
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 arabic-text">متوسط التقدم</p>
              <p className="text-2xl font-bold text-slate-900">{averageProgress}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
