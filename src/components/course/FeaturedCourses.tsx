
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Users, TrendingUp, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_active: boolean;
}

interface FeaturedCoursesProps {
  courses: Course[];
  onEnroll: (courseId: string, type: 'course') => void;
}

const FeaturedCourses = ({ courses, onEnroll }: FeaturedCoursesProps) => {
  const navigate = useNavigate();

  if (courses.length === 0) return null;

  const handleViewDetails = (courseId: string) => {
    navigate(`/course-detail/${courseId}`);
  };

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-semibold text-slate-900 arabic-heading flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          الدورات المميزة
        </h3>
        <Badge variant="secondary" className="arabic-text">
          تعلم شامل
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="relative">
                <img 
                  src={course.thumbnail || '/placeholder.svg'} 
                  alt={course.title}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
                <Badge className="absolute top-2 right-2 bg-blue-600">
                  دورة كاملة
                </Badge>
              </div>
              <CardTitle className="arabic-heading text-xl text-slate-900">
                {course.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 arabic-text line-clamp-3">
                {course.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span className="arabic-text">متعدد المستويات</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} />
                  <span className="arabic-text">تقدم مستمر</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 arabic-text shadow-lg"
                  onClick={() => onEnroll(course.id, 'course')}
                >
                  اشترك في الدورة
                  <Play size={18} className="mr-2" />
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full h-10 arabic-text"
                  onClick={() => handleViewDetails(course.id)}
                >
                  عرض التفاصيل
                  <Eye size={16} className="mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCourses;
