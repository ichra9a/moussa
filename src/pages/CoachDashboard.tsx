
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import CoachSidebar from '@/components/coach/CoachSidebar';
import CoachStudentManagement from '@/components/coach/CoachStudentManagement';
import CoachCourseManagement from '@/components/coach/CoachCourseManagement';
import CoachAssignmentManagement from '@/components/coach/CoachAssignmentManagement';
import CoachQuestionManagement from '@/components/coach/CoachQuestionManagement';
import StatsCards from '@/components/dashboard/StatsCards';

const CoachDashboard = () => {
  const { coach, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalAssignments: 0,
    pendingQuestions: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (coach) {
      fetchStats();
    }
  }, [coach]);

  const fetchStats = async () => {
    try {
      // Count total students (simplified - in real implementation, filter by coach assignments)
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Count total courses
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Count assignments
      const { count: assignmentsCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Count pending questions
      const { count: pendingQuestionsCount } = await supabase
        .from('user_question_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalStudents: studentsCount || 0,
        totalCourses: coursesCount || 0,
        totalAssignments: assignmentsCount || 0,
        pendingQuestions: pendingQuestionsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 arabic-heading mb-2">
                مرحباً {coach?.full_name}
              </h2>
              <p className="text-slate-600 arabic-text text-lg">
                نظرة عامة على أنشطتك التدريبية
              </p>
            </div>
            <StatsCards
              totalStudents={stats.totalStudents}
              totalCourses={stats.totalCourses}
              completedModules={stats.totalAssignments}
              averageProgress={stats.pendingQuestions}
            />
          </div>
        );
      case 'students':
        return <CoachStudentManagement />;
      case 'courses':
        return <CoachCourseManagement />;
      case 'assignments':
        return <CoachAssignmentManagement />;
      case 'questions':
        return <CoachQuestionManagement />;
      default:
        return <div className="arabic-text">المحتوى غير متاح</div>;
    }
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
    <div className="min-h-screen bg-slate-50 flex font-cairo" dir="rtl">
      {/* Sidebar */}
      <CoachSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        coachName={coach?.full_name || ''}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
