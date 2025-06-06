
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Play, LogOut, Trophy, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import NotificationCenter from '@/components/NotificationCenter';
import AchievementBadges from '@/components/AchievementBadges';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      fetchEnrollments();
    }
  }, [student]);

  const fetchEnrollments = async () => {
    if (!student) return;

    try {
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          courses!fk_student_enrollments_course (
            id,
            title,
            description,
            thumbnail
          )
        `)
        .eq('student_id', student.id)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrollments:', error);
        setEnrollments([]);
      } else if (data) {
        // Filter out any enrollments where courses failed to load
        const validEnrollments = data.filter(enrollment => enrollment.courses !== null);
        setEnrollments(validEnrollments);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
    navigate('/');
  };

  const startLearning = (courseId: string) => {
    navigate(`/course/${courseId}`);
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses" className="arabic-text">دوراتي</TabsTrigger>
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
                            src={enrollment.courses?.thumbnail || '/placeholder.svg'} 
                            alt={enrollment.courses?.title || 'دورة'}
                            className="w-full h-32 object-cover rounded-lg mb-4"
                          />
                          <div className="flex items-center justify-between mb-2">
                            <CardTitle className="arabic-heading text-lg">
                              {enrollment.courses?.title || 'دورة غير متاحة'}
                            </CardTitle>
                            {enrollment.completed_at && (
                              <Badge className="bg-green-500">
                                <Trophy size={12} className="ml-1" />
                                مكتملة
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-600 arabic-text text-sm mb-4 line-clamp-2">
                            {enrollment.courses?.description || 'وصف غير متاح'}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="arabic-text">تاريخ التسجيل</span>
                              <span>{new Date(enrollment.enrolled_at).toLocaleDateString('ar')}</span>
                            </div>
                            <Button 
                              className="w-full arabic-text"
                              onClick={() => startLearning(enrollment.course_id)}
                            >
                              <Play className="ml-2 h-4 w-4" />
                              {enrollment.completed_at ? 'مراجعة الدورة' : 'بدء التعلم'}
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
