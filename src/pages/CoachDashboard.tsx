
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import CoachSidebar from '@/components/coach/CoachSidebar';
import CoachStudentManagement from '@/components/coach/CoachStudentManagement';
import CoachCourseManagement from '@/components/coach/CoachCourseManagement';
import CoachAssignmentManagement from '@/components/coach/CoachAssignmentManagement';
import CoachQuestionManagement from '@/components/coach/CoachQuestionManagement';
import CoachOverview from '@/components/coach/enhanced/CoachOverview';
import CoachStudentForm from '@/components/coach/forms/CoachStudentForm';
import CoachCourseForm from '@/components/coach/forms/CoachCourseForm';
import AssignmentQuizForm from '@/components/coach/forms/AssignmentQuizForm';

const CoachDashboard = () => {
  const { coach, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (coach) {
      setLoading(false);
    }
  }, [coach]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleFormClose = () => {
    setActiveForm(null);
    setEditingItem(null);
  };

  const handleFormSave = () => {
    setActiveForm(null);
    setEditingItem(null);
    // Refresh the current tab content
    setActiveTab(activeTab);
  };

  const handleAddStudent = () => {
    setEditingItem(null);
    setActiveForm('student');
  };

  const handleEditStudent = (student: any) => {
    setEditingItem(student);
    setActiveForm('student');
  };

  const handleAddCourse = () => {
    setEditingItem(null);
    setActiveForm('course');
  };

  const handleEditCourse = (course: any) => {
    setEditingItem(course);
    setActiveForm('course');
  };

  const handleAddAssignment = () => {
    setEditingItem(null);
    setActiveForm('assignment');
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingItem(assignment);
    setActiveForm('assignment');
  };

  const renderContent = () => {
    if (activeForm) {
      switch (activeForm) {
        case 'student':
          return (
            <CoachStudentForm
              student={editingItem}
              coachId={coach?.id || ''}
              onStudentSaved={handleFormSave}
              onCancel={handleFormClose}
            />
          );
        case 'course':
          return (
            <CoachCourseForm
              course={editingItem}
              coachId={coach?.id || ''}
              onCourseSaved={handleFormSave}
              onCancel={handleFormClose}
            />
          );
        case 'assignment':
          return (
            <AssignmentQuizForm
              assignment={editingItem}
              courseId={editingItem?.course_id || ''}
              onAssignmentSaved={handleFormSave}
              onCancel={handleFormClose}
            />
          );
        default:
          return null;
      }
    }

    switch (activeTab) {
      case 'overview':
        return <CoachOverview coachId={coach?.id || ''} />;
      case 'students':
        return (
          <CoachStudentManagement
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
          />
        );
      case 'courses':
        return (
          <CoachCourseManagement
            onAddCourse={handleAddCourse}
            onEditCourse={handleEditCourse}
          />
        );
      case 'assignments':
        return (
          <CoachAssignmentManagement
            onAddAssignment={handleAddAssignment}
            onEditAssignment={handleEditAssignment}
          />
        );
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
