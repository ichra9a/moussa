
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, FileText, MessageSquare, TrendingUp, Award, Clock, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoachStats {
  totalStudents: number;
  totalCourses: number;
  totalAssignments: number;
  pendingQuestions: number;
  completionRate: number;
  activeStudents: number;
  newEnrollments: number;
  avgProgress: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'assignment' | 'completion';
  student_name: string;
  course_title?: string;
  assignment_title?: string;
  created_at: string;
}

const CoachOverview = ({ coachId }: { coachId: string }) => {
  const [stats, setStats] = useState<CoachStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalAssignments: 0,
    pendingQuestions: 0,
    completionRate: 0,
    activeStudents: 0,
    newEnrollments: 0,
    avgProgress: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (coachId) {
      fetchCoachStats();
      fetchRecentActivities();
    }
  }, [coachId]);

  const fetchCoachStats = async () => {
    try {
      // Get coach's assigned courses
      const { data: coachCourses } = await supabase
        .from('coach_course_assignments')
        .select('course_id')
        .eq('coach_id', coachId)
        .eq('is_active', true);

      const courseIds = coachCourses?.map(cc => cc.course_id) || [];

      if (courseIds.length === 0) {
        setLoading(false);
        return;
      }

      // Count students enrolled in coach's courses
      const { count: studentsCount } = await supabase
        .from('student_enrollments')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .eq('is_active', true);

      // Count assignments for coach's courses
      const { count: assignmentsCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .eq('is_active', true);

      // Count pending question submissions
      const { count: pendingQuestionsCount } = await supabase
        .from('user_question_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calculate recent enrollments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: newEnrollmentsCount } = await supabase
        .from('student_enrollments')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .gte('enrolled_at', thirtyDaysAgo.toISOString())
        .eq('is_active', true);

      setStats({
        totalStudents: studentsCount || 0,
        totalCourses: courseIds.length,
        totalAssignments: assignmentsCount || 0,
        pendingQuestions: pendingQuestionsCount || 0,
        completionRate: 85, // Placeholder - calculate from actual data
        activeStudents: Math.floor((studentsCount || 0) * 0.7), // Placeholder
        newEnrollments: newEnrollmentsCount || 0,
        avgProgress: 72 // Placeholder - calculate from actual progress data
      });
    } catch (error) {
      console.error('Error fetching coach stats:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الإحصائيات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // This is a simplified version - in a real implementation, you'd have an activities table
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          enrolled_at,
          students (full_name),
          courses (title)
        `)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = (enrollments || []).map(enrollment => ({
        id: enrollment.id,
        type: 'enrollment',
        student_name: enrollment.students?.full_name || 'طالب غير معروف',
        course_title: enrollment.courses?.title || 'دورة غير معروفة',
        created_at: enrollment.enrolled_at
      }));

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment': return <Users className="h-4 w-4 text-blue-500" />;
      case 'assignment': return <FileText className="h-4 w-4 text-green-500" />;
      case 'completion': return <Award className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
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
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium arabic-text">إجمالي الطلاب</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalStudents}</p>
                <p className="text-xs text-blue-500 arabic-text">
                  {stats.activeStudents} نشط
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium arabic-text">الدورات</p>
                <p className="text-2xl font-bold text-green-700">{stats.totalCourses}</p>
                <p className="text-xs text-green-500 arabic-text">
                  {stats.newEnrollments} تسجيل جديد
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium arabic-text">الواجبات</p>
                <p className="text-2xl font-bold text-purple-700">{stats.totalAssignments}</p>
                <p className="text-xs text-purple-500 arabic-text">
                  {stats.pendingQuestions} في الانتظار
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium arabic-text">معدل الإكمال</p>
                <p className="text-2xl font-bold text-orange-700">{stats.completionRate}%</p>
                <p className="text-xs text-orange-500 arabic-text">
                  متوسط التقدم {stats.avgProgress}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="arabic-heading flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              نظرة عامة على التقدم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm arabic-text">معدل إكمال الدورات</span>
                <span className="text-sm font-semibold">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm arabic-text">متوسط تقدم الطلاب</span>
                <span className="text-sm font-semibold">{stats.avgProgress}%</span>
              </div>
              <Progress value={stats.avgProgress} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm arabic-text">الطلاب النشطون</span>
                <span className="text-sm font-semibold">
                  {Math.round((stats.activeStudents / stats.totalStudents) * 100) || 0}%
                </span>
              </div>
              <Progress 
                value={Math.round((stats.activeStudents / stats.totalStudents) * 100) || 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="arabic-heading flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              النشاطات الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm arabic-text">
                        <span className="font-medium">{activity.student_name}</span>
                        {activity.type === 'enrollment' && (
                          <span> سجل في دورة {activity.course_title}</span>
                        )}
                        {activity.type === 'assignment' && (
                          <span> أرسل واجب {activity.assignment_title}</span>
                        )}
                        {activity.type === 'completion' && (
                          <span> أكمل دورة {activity.course_title}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 arabic-text">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center arabic-text py-4">
                  لا توجد نشاطات حديثة
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="arabic-heading">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-700 arabic-text">إضافة طالب</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
              <BookOpen className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-700 arabic-text">إنشاء دورة</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
              <FileText className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-700 arabic-text">إضافة واجب</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
              <MessageSquare className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-700 arabic-text">الرسائل</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachOverview;
