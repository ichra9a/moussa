
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Lock, Eye } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  course_id: string;
  order_index: number;
  is_active: boolean;
  courses: {
    title: string;
    thumbnail: string;
  };
}

interface ModuleSubscriptionProps {
  module: Module;
}

const ModuleSubscription = ({ module }: ModuleSubscriptionProps) => {
  const navigate = useNavigate();

  const handleViewModule = () => {
    navigate(`/course/${module.course_id}`);
  };

  const handleViewCourse = () => {
    navigate(`/course-detail/${module.course_id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="relative">
          <img 
            src={module.courses.thumbnail || '/placeholder.svg'} 
            alt={module.title}
            className="w-full h-32 object-cover rounded-lg mb-4"
          />
          <Badge className="absolute top-2 right-2 bg-blue-500">
            <Lock size={12} className="ml-1" />
            متاح عبر الدورة
          </Badge>
        </div>
        <CardTitle className="arabic-heading text-lg">
          {module.title}
        </CardTitle>
        <p className="text-sm text-slate-600 arabic-text">
          من دورة: {module.courses.title}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-slate-600 arabic-text text-sm mb-4 line-clamp-2">
          {module.description}
        </p>
        
        <div className="space-y-2">
          <Button 
            className="w-full arabic-text"
            onClick={handleViewModule}
          >
            عرض في الدورة
            <BookOpen size={16} className="mr-2" />
          </Button>
          
          <Button 
            variant="outline"
            className="w-full arabic-text"
            onClick={handleViewCourse}
          >
            عرض تفاصيل الدورة
            <Eye size={16} className="mr-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleSubscription;
