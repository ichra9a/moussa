
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, GraduationCap, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCards from '@/components/dashboard/StatsCards';
import StudentProgress from '@/components/dashboard/StudentProgress';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_active: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  course_id: string;
  order_index: number;
  is_active: boolean;
  courses: Course;
}

interface Subscription {
  id: string;
  student_id: string;
  module_id: string;
  progress: number;
  completed_at: string | null;
  students: {
    full_name: string;
  };
  modules: Module;
}

const CoachDashboard = () => {
  const { coach, signOut } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (coach) {
      fetchData();
    }
  }, [coach]);

  const fetchData = async () => {
    try {
      // Fetch all subscriptions with student and module details
      const { data: subscriptionsData } = await supabase
        .from('module_subscriptions')
        .select(`
          *,
          students!fk_module_subscriptions_student (full_name),
          modules!fk_module_subscriptions_module (
            id,
            title,
            description,
            course_id,
            order_index,
            is_active,
            courses!fk_modules_course (
              id,
              title,
              description,
              thumbnail,
              is_active
            )
          )
        `)
        .eq('is_active', true);

      // Fetch all courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true);

      if (subscriptionsData) {
        // Filter out any subscriptions where students, modules, or courses failed to load
        const validSubscriptions = subscriptionsData.filter(sub => 
          sub.students !== null && sub.modules !== null && sub.modules.courses !== null
        );
        setSubscriptions(validSubscriptions);
      }
      if (coursesData) setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const totalStudents = new Set(subscriptions.map(sub => sub.student_id)).size;
  const completedModules = subscriptions.filter(sub => sub.completed_at).length;
  const averageProgress = subscriptions.length > 0 
    ? Math.round(subscriptions.reduce((sum, sub) => sum + (sub.progress || 0), 0) / subscriptions.length)
    : 0;

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
            <h1 className="text-2xl font-bold text-slate-900 arabic-heading">لوحة المدرب</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <GraduationCap size={16} />
                <span className="arabic-text">{coach?.full_name}</span>
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
            مرحباً {coach?.full_name}
          </h2>
          <p className="text-slate-600 arabic-text text-lg">
            إدارة الطلاب والدورات التدريبية
          </p>
        </div>

        {/* Statistics Cards */}
        <StatsCards
          totalStudents={totalStudents}
          totalCourses={courses.length}
          completedModules={completedModules}
          averageProgress={averageProgress}
        />

        {/* Student Progress */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-slate-900 arabic-heading mb-6">
            تقدم الطلاب
          </h3>
          <StudentProgress subscriptions={subscriptions} />
        </div>

        {/* Available Courses */}
        <div>
          <h3 className="text-2xl font-semibold text-slate-900 arabic-heading mb-6">
            الدورات المتاحة
          </h3>
          
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
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
                    <p className="text-slate-600 arabic-text text-sm line-clamp-3">
                      {course.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen size={64} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 arabic-heading mb-2">
                لا توجد دورات متاحة حالياً
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
