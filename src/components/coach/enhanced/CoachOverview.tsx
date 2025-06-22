
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp,
  Clock,
  Award,
  BarChart3
} from 'lucide-react';

interface CoachOverviewProps {
  coachId: string;
}

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalAssignments: number;
  avgCompletionRate: number;
  recentActivity: Array<{
    id: string;
    type: 'enrollment' | 'completion' | 'submission';
    student_name: string;
    course_title: string;
    timestamp: string;
  }>;
}

const CoachOverview = ({ coachId }: CoachOverviewProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalAssignments: 0,
    avgCompletionRate: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coachId) {
      fetchDashboardStats();
    }
  }, [coachId]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Get coach's courses
      const { data: coachCourses } = await supabase
        .from('coach_course_assignments')
        .select('course_id')
        .eq('coach_id', coachId)
        .eq('is_active', true);

      const courseIds = coachCourses?.map(cc => cc.course_id) || [];

      if (courseIds.length === 0) {
        setStats({
          totalStudents: 0,
          totalCourses: 0,
          totalAssignments: 0,
          avgCompletionRate: 0,
          recentActivity: []
        });
        return;
      }

      // Get students enrolled in coach's courses
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select(`
          student_id,
          course_id,
          enrolled_at,
          students!inner(full_name),
          courses!inner(title)
        `)
        .in('course_id', courseIds)
        .eq('is_active', true);

      // Get assignments for coach's courses
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, course_id')
        .in('course_id', courseIds)
        .eq('is_active', true);

      // Calculate completion rates
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, student_id, status')
        .in('assignment_id', assignments?.map(a => a.id) || []);

      const totalSubmissions = submissions?.length || 0;
      const completedSubmissions = submissions?.filter(s => s.status === 'submitted').length || 0;
      const avgCompletionRate = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;

      // Format recent activity
      const recentActivity = enrollments?.slice(0, 5).map(enrollment => ({
        id: enrollment.student_id,
        type: 'enrollment' as const,
        student_name: (enrollment.students as any)?.full_name || 'Unknown Student',
        course_title: (enrollment.courses as any)?.title || 'Unknown Course',
        timestamp: enrollment.enrolled_at
      })) || [];

      setStats({
        totalStudents: new Set(enrollments?.map(e => e.student_id)).size,
        totalCourses: courseIds.length,
        totalAssignments: assignments?.length || 0,
        avgCompletionRate,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold arabic-heading mb-2">مرحباً في لوحة التحكم</h1>
        <p className="arabic-text opacity-90">نظرة شاملة على أداء طلابك ودوراتك</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">إجمالي الطلاب</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">الدورات المسندة</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalCourses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">الواجبات النشطة</p>
                <p className="text-3xl font-bold text-orange-600">{stats.totalAssignments}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">معدل الإنجاز</p>
                <p className="text-3xl font-bold text-purple-600">{stats.avgCompletionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="arabic-heading flex items-center gap-2">
              <Clock className="h-5 w-5" />
              النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold arabic-text">{activity.student_name}</p>
                      <p className="text-sm text-gray-600 arabic-text">
                        التحق بدورة: {activity.course_title}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {new Date(activity.timestamp).toLocaleDateString('ar-SA')}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 arabic-text text-center py-4">لا يوجد نشاط حديث</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="arabic-heading flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ملخص الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm arabic-text">معدل إكمال الواجبات</span>
                <span className="text-sm font-semibold">{stats.avgCompletionRate}%</span>
              </div>
              <Progress value={stats.avgCompletionRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm arabic-text">نشاط الطلاب</span>
                <span className="text-sm font-semibold">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm arabic-text">رضا الطلاب</span>
                <span className="text-sm font-semibold">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold arabic-heading">إضافة طالب جديد</h3>
                  <p className="text-sm text-gray-600 arabic-text">إضافة طالب إلى دوراتك</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold arabic-heading">إنشاء واجب جديد</h3>
                  <p className="text-sm text-gray-600 arabic-text">إضافة واجب للطلاب</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold arabic-heading">مراجعة الدرجات</h3>
                  <p className="text-sm text-gray-600 arabic-text">تقييم واجبات الطلاب</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachOverview;
