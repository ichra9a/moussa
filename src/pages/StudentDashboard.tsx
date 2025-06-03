
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, CheckCircle, Lock, Award, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_active: boolean;
}

interface Enrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  courses: Course;
}

const StudentDashboard = () => {
  const { student, signOut } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (student) {
      fetchEnrollments();
      fetchAvailableCourses();
    }
  }, [student]);

  const fetchEnrollments = async () => {
    if (!student) return;
    
    const { data, error } = await supabase
      .from('student_enrollments')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          thumbnail,
          is_active
        )
      `)
      .eq('student_id', student.id)
      .eq('is_active', true);

    if (!error && data) {
      setEnrollments(data);
    }
  };

  const fetchAvailableCourses = async () => {
    if (!student) return;
    
    const { data: enrolledCourseIds } = await supabase
      .from('student_enrollments')
      .select('course_id')
      .eq('student_id', student.id);

    const enrolledIds = enrolledCourseIds?.map(e => e.course_id) || [];

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .not('id', 'in', `(${enrolledIds.join(',') || 'null'})`);

    if (!error && data) {
      setAvailableCourses(data);
    }
    setLoading(false);
  };

  const enrollInCourse = async (courseId: string) => {
    if (!student) return;

    const { error } = await supabase
      .from('student_enrollments')
      .insert({
        student_id: student.id,
        course_id: courseId
      });

    if (!error) {
      fetchEnrollments();
      fetchAvailableCourses();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="arabic-text text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-cairo" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-slate-900 arabic-heading">لوحة الطالب</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <User size={16} />
                <span className="arabic-text">{student?.full_name}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 arabic-text"
              >
                <LogOut size={16} />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 arabic-heading mb-2">
            مرحباً {student?.full_name}
          </h2>
          <p className="text-slate-600 arabic-text text-lg">
            استمر في رحلتك التعليمية وحقق أهدافك
          </p>
        </div>

        {/* Enrolled Courses */}
        {enrollments.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-slate-900 arabic-heading mb-6">
              دوراتي الحالية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="relative">
                      <img 
                        src={enrollment.courses.thumbnail || '/placeholder.svg'} 
                        alt={enrollment.courses.title}
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                      {enrollment.completed_at && (
                        <Badge className="absolute top-2 right-2 bg-green-500">
                          <Award size={12} className="ml-1" />
                          مكتملة
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="arabic-heading text-lg">
                      {enrollment.courses.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 arabic-text text-sm mb-4 line-clamp-2">
                      {enrollment.courses.description}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="arabic-text">التقدم</span>
                          <span>0%</span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                      <Button 
                        className="w-full arabic-text"
                        onClick={() => navigate(`/course/${enrollment.course_id}`)}
                      >
                        {enrollment.completed_at ? 'مراجعة الدورة' : 'متابعة التعلم'}
                        <Play size={16} className="mr-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Courses */}
        {availableCourses.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 arabic-heading mb-6">
              الدورات المتاحة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <img 
                      src={course.thumbnail || '/placeholder.svg'} 
                      alt={course.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                    <CardTitle className="arabic-heading text-lg">
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 arabic-text text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>
                    <Button 
                      className="w-full arabic-text"
                      onClick={() => enrollInCourse(course.id)}
                    >
                      التسجيل في الدورة
                      <BookOpen size={16} className="mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {enrollments.length === 0 && availableCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={64} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 arabic-heading mb-2">
              لا توجد دورات متاحة حالياً
            </h3>
            <p className="text-slate-500 arabic-text">
              ستتوفر دورات جديدة قريباً، ترقب التحديثات
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
