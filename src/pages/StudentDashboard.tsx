import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import StudentProgress from '@/components/dashboard/StudentProgress';
import ModuleVideos from '@/components/dashboard/ModuleVideos';
import EnrolledCourseModules from '@/components/dashboard/EnrolledCourseModules';
import NotificationCenter from '@/components/NotificationCenter';
import VideoModal from '@/components/VideoModal';
import { supabase } from '@/integrations/supabase/client';

const StudentDashboard = () => {
  const { student, logout } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    completedModules: 0,
    averageProgress: 0
  });
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (student) {
      fetchStats();
      fetchSubscriptions();
    }
  }, [student]);

  const fetchStats = async () => {
    if (!student) return;

    try {
      // Get student's enrolled courses count
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_enrollments')
        .select('course_id')
        .eq('student_id', student.id)
        .eq('is_active', true);

      // Get student's module subscriptions for progress calculation
      const { data: moduleSubscriptions, error: moduleError } = await supabase
        .from('module_subscriptions')
        .select('*')
        .eq('student_id', student.id);

      if (!enrollError && !moduleError) {
        const completedModules = moduleSubscriptions?.filter(sub => sub.completed_at)?.length || 0;
        const totalProgress = moduleSubscriptions?.reduce((sum, sub) => sum + (sub.progress || 0), 0) || 0;
        const averageProgress = moduleSubscriptions?.length ? Math.round(totalProgress / moduleSubscriptions.length) : 0;

        setStats({
          totalStudents: 1, // Current student
          totalCourses: enrollments?.length || 0,
          completedModules,
          averageProgress
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSubscriptions = async () => {
    if (!student) return;

    try {
      const { data, error } = await supabase
        .from('module_subscriptions')
        .select(`
          *,
          students(full_name),
          modules(title)
        `)
        .eq('student_id', student.id);

      if (!error && data) {
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!student) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic-heading">
                مرحباً، {student.full_name}
              </h1>
              <p className="text-gray-600 arabic-text">لوحة التحكم الخاصة بك</p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="arabic-text"
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <StatsCards 
              totalStudents={stats.totalStudents}
              totalCourses={stats.totalCourses}
              completedModules={stats.completedModules}
              averageProgress={stats.averageProgress}
            />
            <EnrolledCourseModules onVideoSelect={setSelectedVideo} />
            <ModuleVideos />
            <StudentProgress subscriptions={subscriptions} />
          </div>
          
          <div className="space-y-8">
            <NotificationCenter />
          </div>
        </div>
      </div>

      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
};

export default StudentDashboard;
