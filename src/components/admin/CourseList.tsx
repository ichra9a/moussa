
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_active: boolean;
}

interface CourseListProps {
  courses: Course[];
  onEditCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
}

const CourseList = ({ courses, onEditCourse, onDeleteCourse }: CourseListProps) => {
  if (courses.length === 0) {
    return (
      <p className="text-center text-gray-500 py-4 arabic-text">لا توجد دورات حالياً</p>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="font-semibold text-lg arabic-heading">قائمة الدورات الحالية</h3>
      {courses.map(course => (
        <Card key={course.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {course.thumbnail && (
              <div className="md:w-1/4 h-32 md:h-auto">
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4 flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg arabic-text">{course.title}</h3>
                  <p className="text-gray-600 arabic-text mt-1">{course.description}</p>
                  <Badge className="mt-2" variant={course.is_active ? "default" : "outline"}>
                    {course.is_active ? "نشط" : "غير نشط"}
                  </Badge>
                </div>
                {(onEditCourse || onDeleteCourse) && (
                  <div className="flex gap-2 ml-4">
                    {onEditCourse && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditCourse(course)}
                        className="arabic-text"
                      >
                        <Edit className="h-4 w-4" />
                        تعديل
                      </Button>
                    )}
                    {onDeleteCourse && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteCourse(course.id)}
                        className="arabic-text"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CourseList;
