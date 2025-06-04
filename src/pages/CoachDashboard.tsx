
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Award, LogOut, GraduationCap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
          students (full_name),
          modules (
            id,
            title,
            description,
            course_id,
            order_index,
            is_active,
            courses (
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

      if (subscriptionsData) setSubscriptions(subscriptionsData);
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
                  <p className="text-2xl font-bold text-slate-900">{courses.length}</p>
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

        {/* Student Progress */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-slate-900 arabic-heading mb-6">
            تقدم الطلاب
          </h3>
          
          {subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="arabic-heading text-lg">
                          {subscription.students.full_name}
                        </CardTitle>
                        <p className="text-slate-600 arabic-text text-sm">
                          {subscription.modules.title}
                        </p>
                      </div>
                      <Badge variant={subscription.completed_at ? 'default' : 'secondary'}>
                        {subscription.completed_at ? 'مكتمل' : 'قيد التقدم'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="arabic-text">التقدم</span>
                        <span>{subscription.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${subscription.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 arabic-heading mb-2">
                لا يوجد طلاب مسجلين حالياً
              </h3>
              <p className="text-slate-500 arabic-text">
                سيظهر تقدم الطلاب هنا عند تسجيلهم في الدورات
              </p>
            </div>
          )}
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
