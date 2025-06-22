
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Plus, Search, Edit, Trash2, Users, Video } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  is_active: boolean;
  created_at: string;
  student_count?: number;
  video_count?: number;
}

interface CoachCourseManagementProps {
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
}

const CoachCourseManagement = ({ onAddCourse, onEditCourse }: CoachCourseManagementProps) => {
  const { coach } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (coach) {
      fetchCourses();
    }
  }, [coach]);

  const fetchCourses = async () => {
    if (!coach) return;

    try {
      setLoading(true);

      // Get courses assigned to this coach
      const { data: assignments } = await supabase
        .from('coach_course_assignments')
        .select(`
          course_id,
          courses (
            id,
            title,
            description,
            thumbnail,
            is_active,
            created_at
          )
        `)
        .eq('coach_id', coach.id)
        .eq('is_active', true);

      if (assignments) {
        const coursesWithStats = await Promise.all(
          assignments.map(async (assignment) => {
            const course = assignment.courses as any;
            
            // Get student count
            const { count: studentCount } = await supabase
              .from('student_enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id)
              .eq('is_active', true);

            // Get video count
            const { count: videoCount } = await supabase
              .from('videos')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            return {
              ...course,
              student_count: studentCount || 0,
              video_count: videoCount || 0
            };
          })
        );

        setCourses(coursesWithStats);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الدورات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: false })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الدورة بنجاح"
      });

      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الدورة",
        variant: "destructive"
      });
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold arabic-heading">إدارة الدورات</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold arabic-heading">إدارة الدورات</h2>
        <Button onClick={onAddCourse} className="arabic-text">
          <Plus className="h-4 w-4 mr-2" />
          إضافة دورة جديدة
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في الدورات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 arabic-text"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">إجمالي الدورات</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">إجمالي الطلاب</p>
                <p className="text-2xl font-bold">
                  {courses.reduce((sum, course) => sum + (course.student_count || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">إجمالي الفيديوهات</p>
                <p className="text-2xl font-bold">
                  {courses.reduce((sum, course) => sum + (course.video_count || 0), 0)}
                </p>
              </div>
              <Video className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="arabic-heading text-lg">{course.title}</CardTitle>
                <Badge variant={course.is_active ? "default" : "secondary"}>
                  {course.is_active ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              
              {course.description && (
                <p className="text-sm text-gray-600 arabic-text line-clamp-2">
                  {course.description}
                </p>
              )}

              <div className="flex justify-between text-sm text-gray-500">
                <span className="arabic-text">الطلاب: {course.student_count}</span>
                <span className="arabic-text">الفيديوهات: {course.video_count}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditCourse(course)}
                  className="flex-1 arabic-text"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCourse(course.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 arabic-heading mb-2">
              لا توجد دورات
            </h3>
            <p className="text-gray-500 arabic-text mb-4">
              {searchTerm ? 'لم يتم العثور على دورات تطابق البحث' : 'لم يتم تعيين أي دورات لك بعد'}
            </p>
            {!searchTerm && (
              <Button onClick={onAddCourse} className="arabic-text">
                <Plus className="h-4 w-4 mr-2" />
                إضافة دورة جديدة
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachCourseManagement;
