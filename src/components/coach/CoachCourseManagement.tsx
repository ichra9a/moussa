
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, PlayCircle, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_active: boolean;
  created_at: string;
  modules_count: number;
  videos_count: number;
  students_count: number;
}

const CoachCourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('Fetching courses for coach...');

      // Fetch all active courses (in a real implementation, this would be filtered by coach assignment)
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Enhance each course with additional statistics
      const coursesWithStats = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Count modules
          const { count: modulesCount } = await supabase
            .from('modules')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)
            .eq('is_active', true);

          // Count videos
          const { count: videosCount } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Count enrolled students
          const { count: studentsCount } = await supabase
            .from('student_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)
            .eq('is_active', true);

          return {
            ...course,
            modules_count: modulesCount || 0,
            videos_count: videosCount || 0,
            students_count: studentsCount || 0
          };
        })
      );

      setCourses(coursesWithStats);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات الدورات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 arabic-heading">إدارة الدورات</h2>
        <Badge variant="outline" className="arabic-text">
          {courses.length} دورة
        </Badge>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <img 
                  src={course.thumbnail || '/placeholder.svg'} 
                  alt={course.title}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <CardTitle className="arabic-heading text-lg line-clamp-2">
                  {course.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 arabic-text text-sm line-clamp-3">
                  {course.description}
                </p>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <BookOpen className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-blue-600">{course.modules_count}</div>
                    <div className="text-xs text-gray-500 arabic-text">وحدة</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg">
                    <PlayCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-green-600">{course.videos_count}</div>
                    <div className="text-xs text-gray-500 arabic-text">فيديو</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-purple-600">{course.students_count}</div>
                    <div className="text-xs text-gray-500 arabic-text">طالب</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 arabic-text">
                  تاريخ الإنشاء: {formatDate(course.created_at)}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 arabic-text">
                    <Eye className="h-4 w-4 ml-1" />
                    عرض
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 arabic-text">
                    <Edit className="h-4 w-4 ml-1" />
                    تعديل
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2 arabic-text">
              لا توجد دورات
            </h3>
            <p className="text-gray-500 arabic-text">
              لم يتم تعيين أي دورات لك بعد
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachCourseManagement;
