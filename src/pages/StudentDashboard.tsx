
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Play, Users, LogOut, Trophy, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ModuleSubscription from '@/components/ModuleSubscription';
import NotificationCenter from '@/components/NotificationCenter';
import AchievementBadges from '@/components/AchievementBadges';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
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
  courses: Course;
}

interface ModuleSubscription {
  id: string;
  module_id: string;
  progress: number;
  completed_at: string | null;
}

const StudentDashboard = () => {
  const { student, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [moduleSubscriptions, setModuleSubscriptions] = useState<ModuleSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      fetchData();
    }
  }, [student]);

  const fetchData = async () => {
    await Promise.all([
      fetchEnrollments(),
      fetchAvailableModules(),
      fetchModuleSubscriptions()
    ]);
    setLoading(false);
  };

  const fetchEnrollments = async () => {
    if (!student) return;

    const { data } = await supabase
      .from('student_enrollments')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          thumbnail
        )
      `)
      .eq('student_id', student.id)
      .eq('is_active', true);

    if (data) setEnrollments(data);
  };

  const fetchAvailableModules = async () => {
    const { data } = await supabase
      .from('modules')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          thumbnail
        )
      `)
      .eq('is_active', true)
      .order('order_index');

    if (data) setAvailableModules(data);
  };

  const fetchModuleSubscriptions = async () => {
    if (!student) return;

    const { data } = await supabase
      .from('module_subscriptions')
      .select('*')
      .eq('student_id', student.id)
      .eq('is_active', true);

    if (data) setModuleSubscriptions(data);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
    navigate('/');
  };

  const getModuleSubscription = (moduleId: string) => {
    return moduleSubscriptions.find(sub => sub.module_id === moduleId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 arabic-text">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 arabic-heading">
                مرحباً، {student?.full_name}
              </h1>
              <p className="text-slate-600 arabic-text">
                رمز PIN: {student?.pin_code}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="arabic-text"
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses" className="arabic-text">دوراتي</TabsTrigger>
            <TabsTrigger value="modules" className="arabic-text">المودولات</TabsTrigger>
            <TabsTrigger value="achievements" className="arabic-text">الإنجازات</TabsTrigger>
            <TabsTrigger value="notifications" className="arabic-text">الإشعارات</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 arabic-heading">
                  <BookOpen className="h-5 w-5" />
                  الدورات المسجل فيها
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 arabic-text">لم تسجل في أي دورة بعد</p>
                    <p className="text-sm text-gray-400 arabic-text">
                      تواصل مع الإدارة للتسجيل في الدورات
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                          <img 
                            src={enrollment.courses.thumbnail || '/placeholder.svg'} 
                            alt={enrollment.courses.title}
                            className="w-full h-32 object-cover rounded-lg mb-4"
                          />
                          <CardTitle className="arabic-heading text-lg">
                            {enrollment.courses.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-600 arabic-text text-sm mb-4">
                            {enrollment.courses.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="arabic-text">تاريخ التسجيل</span>
                              <span>{new Date(enrollment.enrolled_at).toLocaleDateString('ar')}</span>
                            </div>
                            <Button className="w-full arabic-text">
                              <Play className="ml-2 h-4 w-4" />
                              متابعة التعلم
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 arabic-heading">
                  <Play className="h-5 w-5" />
                  المودولات المتاحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableModules.length === 0 ? (
                  <div className="text-center py-8">
                    <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 arabic-text">لا توجد مودولات متاحة حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableModules.map((module) => (
                      <ModuleSubscription
                        key={module.id}
                        module={module}
                        subscription={getModuleSubscription(module.id)}
                        onSubscriptionUpdate={fetchModuleSubscriptions}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementBadges />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
