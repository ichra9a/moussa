
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Play, CheckCircle, User, LogOut, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModuleSubscription from '@/components/ModuleSubscription';

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

interface Enrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  courses: Course;
}

interface ModuleSubscription {
  id: string;
  module_id: string;
  progress: number;
  completed_at: string | null;
  modules: Module;
}

const StudentDashboard = () => {
  const { student, signOut } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [moduleSubscriptions, setModuleSubscriptions] = useState<ModuleSubscription[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (student) {
      fetchData();
    }
  }, [student]);

  const fetchData = async () => {
    if (!student) return;
    
    try {
      // Fetch course enrollments
      const { data: enrollmentsData } = await supabase
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

      // Fetch module subscriptions
      const { data: moduleSubscriptionsData } = await supabase
        .from('module_subscriptions')
        .select(`
          *,
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
        .eq('student_id', student.id)
        .eq('is_active', true);

      // Fetch available courses (not enrolled)
      const enrolledCourseIds = enrollmentsData?.map(e => e.course_id) || [];
      const { data: availableCoursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .not('id', 'in', `(${enrolledCourseIds.join(',') || 'null'})`);

      // Fetch available modules (not subscribed)
      const subscribedModuleIds = moduleSubscriptionsData?.map(s => s.module_id) || [];
      const { data: availableModulesData } = await supabase
        .from('modules')
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
        .eq('is_active', true)
        .not('id', 'in', `(${subscribedModuleIds.join(',') || 'null'})`);

      if (enrollmentsData) setEnrollments(enrollmentsData);
      if (moduleSubscriptionsData) setModuleSubscriptions(moduleSubscriptionsData);
      if (availableCoursesData) setAvailableCourses(availableCoursesData);
      if (availableModulesData) setAvailableModules(availableModulesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
      fetchData();
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

        {/* Tabs for different content */}
        <Tabs defaultValue="courses" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses" className="arabic-text">الدورات الكاملة</TabsTrigger>
            <TabsTrigger value="modules" className="arabic-text">المودولات المفردة</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-8">
            {/* Enrolled Courses */}
            {enrollments.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 arabic-heading mb-6">
                  دوراتي الحالية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
                              <CheckCircle size={12} className="ml-1" />
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
                        <Button 
                          className="w-full arabic-text"
                          onClick={() => navigate(`/course/${enrollment.course_id}`)}
                        >
                          {enrollment.completed_at ? 'مراجعة الدورة' : 'متابعة التعلم'}
                          <Play size={16} className="mr-2" />
                        </Button>
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
          </TabsContent>

          <TabsContent value="modules" className="space-y-8">
            {/* Module Subscriptions */}
            {moduleSubscriptions.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 arabic-heading mb-6">
                  مودولاتي الحالية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {moduleSubscriptions.map((subscription) => (
                    <ModuleSubscription
                      key={subscription.id}
                      module={subscription.modules}
                      subscription={{
                        id: subscription.id,
                        progress: subscription.progress,
                        completed_at: subscription.completed_at
                      }}
                      onSubscriptionUpdate={fetchData}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available Modules */}
            {availableModules.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 arabic-heading mb-6">
                  المودولات المتاحة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableModules.map((module) => (
                    <ModuleSubscription
                      key={module.id}
                      module={module}
                      onSubscriptionUpdate={fetchData}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {enrollments.length === 0 && availableCourses.length === 0 && 
         moduleSubscriptions.length === 0 && availableModules.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap size={64} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 arabic-heading mb-2">
              لا توجد دورات أو مودولات متاحة حالياً
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
