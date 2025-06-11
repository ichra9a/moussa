import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import StudentProgress from '@/components/dashboard/StudentProgress';
import ModuleVideos from '@/components/dashboard/ModuleVideos';
import EnrolledCourseVideos from '@/components/dashboard/EnrolledCourseVideos';
import NotificationCenter from '@/components/NotificationCenter';
import VideoModal from '@/components/VideoModal';
import { supabase } from '@/integrations/supabase/client';
const StudentDashboard = () => {
  const {
    student,
    logout
  } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    completedVideos: 0,
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
      const {
        data: enrollments,
        error: enrollError
      } = await supabase.from('student_enrollments').select('course_id').eq('student_id', student.id).eq('is_active', true);

      // Get student's video progress for completed videos calculation
      const {
        data: videoProgress,
        error: videoError
      } = await supabase.from('student_video_progress').select('*').eq('student_id', student.id);
      if (!enrollError && !videoError) {
        const completedVideos = videoProgress?.filter(progress => progress.completed_at)?.length || 0;
        const totalProgress = videoProgress?.reduce((sum, progress) => sum + (progress.completion_percentage || 0), 0) || 0;
        const averageProgress = videoProgress?.length ? Math.round(totalProgress / videoProgress.length) : 0;
        setStats({
          totalStudents: 1,
          // Current student
          totalCourses: enrollments?.length || 0,
          completedVideos,
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
      // Since we're removing modules, we'll use course enrollments instead
      const {
        data,
        error
      } = await supabase.from('student_enrollments').select(`
          *,
          courses(title)
        `).eq('student_id', student.id);
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
  return <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-[22px]">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic-heading">
                مرحباً، {student.full_name}
              </h1>
              <p className="text-gray-600 arabic-text">لوحة التحكم الخاصة بك</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="arabic-text px-[12px]">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <StatsCards totalStudents={stats.totalStudents} totalCourses={stats.totalCourses} completedModules={stats.completedVideos} averageProgress={stats.averageProgress} />
            <EnrolledCourseVideos onVideoSelect={setSelectedVideo} />
            <StudentProgress subscriptions={subscriptions} />
          </div>
          
          <div className="space-y-8">
            <NotificationCenter />
          </div>
        </div>
      </div>

      {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>;
};
export default StudentDashboard;