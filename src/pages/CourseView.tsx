
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import CourseProgress from '@/components/course/CourseProgress';
import ModuleSection from '@/components/course/ModuleSection';
import CourseHeader from '@/components/course/CourseHeader';
import { useCourseData } from '@/hooks/useCourseData';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { handleVideoComplete } from '@/components/course/CourseAchievements';

const CourseView = () => {
  const { courseId } = useParams();
  const { student } = useAuth();
  
  const {
    course,
    modules,
    videoProgress,
    moduleCompletions,
    quizCompletions,
    loading,
    fetchVideoProgress,
    fetchQuizCompletions
  } = useCourseData(student, courseId);

  const {
    isModuleCompleted,
    isModuleUnlocked,
    isVideoUnlocked,
    isVideoFullyCompleted,
    getOverallProgress,
    getModuleProgress,
    completedModulesCount,
    totalVideos,
    completedVideos
  } = useCourseProgress(modules, videoProgress, moduleCompletions, quizCompletions);

  const overallProgress = getOverallProgress();

  const onVideoComplete = async (videoId: string) => {
    await fetchVideoProgress();
    await fetchQuizCompletions();
    await handleVideoComplete(videoId, modules, student, isModuleCompleted);
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
      <CourseHeader 
        courseTitle={course?.title || ''} 
        overallProgress={overallProgress} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <CourseProgress
            modules={modules}
            overallProgress={overallProgress}
            completedModules={completedModulesCount}
            completedVideos={completedVideos}
            totalVideos={totalVideos}
            isModuleCompleted={isModuleCompleted}
            isModuleUnlocked={isModuleUnlocked}
            getModuleProgress={getModuleProgress}
          />

          <ModuleSection
            modules={modules}
            isModuleCompleted={isModuleCompleted}
            isModuleUnlocked={isModuleUnlocked}
            isVideoUnlocked={isVideoUnlocked}
            isVideoCompleted={isVideoFullyCompleted}
            onVideoComplete={onVideoComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseView;
