
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseHeaderProps {
  courseTitle: string;
  overallProgress: number;
}

const CourseHeader = ({ courseTitle, overallProgress }: CourseHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowRight size={16} />
              العودة للوحة التحكم
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 arabic-heading">
              {courseTitle}
            </h1>
          </div>
          <Badge variant="outline" className="arabic-text">
            التقدم: {overallProgress}%
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default CourseHeader;
