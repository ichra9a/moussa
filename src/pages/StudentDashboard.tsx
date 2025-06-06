
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import StudentProgress from '@/components/dashboard/StudentProgress';
import ModuleVideos from '@/components/dashboard/ModuleVideos';
import EnrolledCourseModules from '@/components/dashboard/EnrolledCourseModules';
import NotificationCenter from '@/components/NotificationCenter';
import VideoModal from '@/components/VideoModal';

const StudentDashboard = () => {
  const { student, logout } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState(null);

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
            <StatsCards />
            <EnrolledCourseModules onVideoSelect={setSelectedVideo} />
            <ModuleVideos onVideoSelect={setSelectedVideo} />
            <StudentProgress />
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
