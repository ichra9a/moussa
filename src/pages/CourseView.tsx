import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import CourseProgress from '@/components/course/CourseProgress';
import ModuleSection from '@/components/course/ModuleSection';

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  duration_seconds: number;
  order_index: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  videos: Video[];
}

interface VideoProgress {
  video_id: string;
  completion_percentage: number;
  completed_at: string | null;
}

interface ModuleCompletion {
  module_id: string;
  completed_at: string | null;
}

interface QuizCompletion {
  video_id: string;
  completed: boolean;
}

const CourseView = () => {
  const { courseId } = useParams();
  const { student } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [moduleCompletions, setModuleCompletions] = useState<ModuleCompletion[]>([]);
  const [quizCompletions, setQuizCompletions] = useState<QuizCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student && courseId) {
      fetchCourseData();
    }
  }, [student, courseId]);

  const fetchCourseData = async () => {
    if (!student || !courseId) return;

    try {
      // Verify enrollment
      const { data: enrollment } = await supabase
        .from('student_enrollments')
        .select('*')
        .eq('student_id', student.id)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .maybeSingle();

      if (!enrollment) {
        navigate('/dashboard');
        return;
      }

      // Fetch course details
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseData) {
        setCourse(courseData);
      }

      // Fetch modules with videos
      const { data: modulesData } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          description,
          order_index,
          module_videos (
            order_index,
            videos!fk_module_videos_video (
              id,
              title,
              youtube_id,
              duration_seconds
            )
          )
        `)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index');

      if (modulesData) {
        const formattedModules = modulesData.map(module => ({
          id: module.id,
          title: module.title,
          description: module.description,
          order_index: module.order_index,
          videos: module.module_videos
            .filter(mv => mv.videos !== null)
            .map(mv => ({ 
              id: mv.videos!.id,
              title: mv.videos!.title,
              youtube_id: mv.videos!.youtube_id,
              duration_seconds: mv.videos!.duration_seconds,
              order_index: mv.order_index 
            }))
            .sort((a, b) => a.order_index - b.order_index)
        }));
        setModules(formattedModules);
      }

      await fetchVideoProgress();
      await fetchModuleCompletions();
      await fetchQuizCompletions();
      
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoProgress = async () => {
    if (!student) return;

    try {
      const { data } = await supabase
        .from('student_video_progress')
        .select('video_id, completion_percentage, completed_at')
        .eq('student_id', student.id);

      if (data) {
        setVideoProgress(data);
      }
    } catch (error) {
      console.error('Error fetching video progress:', error);
    }
  };

  const fetchModuleCompletions = async () => {
    if (!student) return;

    try {
      const { data } = await supabase
        .from('module_subscriptions')
        .select('module_id, completed_at')
        .eq('student_id', student.id);

      if (data) {
        setModuleCompletions(data);
      }
    } catch (error) {
      console.error('Error fetching module completions:', error);
    }
  };

  const fetchQuizCompletions = async () => {
    if (!student) return;

    try {
      // Get all videos from modules
      const allVideos = modules.flatMap(module => module.videos);
      
      if (allVideos.length === 0) return;

      // Get all verification questions for these videos
      const { data: questions } = await supabase
        .from('video_verification_questions')
        .select('id, video_id')
        .in('video_id', allVideos.map(v => v.id));

      if (!questions || questions.length === 0) {
        // No questions exist, mark all videos as quiz completed
        const completions = allVideos.map(video => ({
          video_id: video.id,
          completed: true
        }));
        setQuizCompletions(completions);
        return;
      }

      // Group questions by video
      const questionsByVideo = questions.reduce((acc, q) => {
        if (!acc[q.video_id]) acc[q.video_id] = [];
        acc[q.video_id].push(q.id);
        return acc;
      }, {} as Record<string, string[]>);

      // Get student answers
      const { data: answers } = await supabase
        .from('student_verification_answers')
        .select('question_id, is_correct')
        .eq('student_id', student.id)
        .in('question_id', questions.map(q => q.id));

      // Calculate completion status for each video
      const completions = allVideos.map(video => {
        const videoQuestions = questionsByVideo[video.id] || [];
        
        if (videoQuestions.length === 0) {
          return { video_id: video.id, completed: true };
        }

        const videoAnswers = answers?.filter(a => 
          videoQuestions.includes(a.question_id)
        ) || [];

        const completed = videoAnswers.length === videoQuestions.length && 
          videoAnswers.every(a => a.is_correct);

        return { video_id: video.id, completed };
      });

      setQuizCompletions(completions);
    } catch (error) {
      console.error('Error fetching quiz completions:', error);
    }
  };

  const isVideoCompleted = (videoId: string) => {
    const progress = videoProgress.find(p => p.video_id === videoId);
    return progress?.completed_at !== null && progress?.completion_percentage >= 95;
  };

  const isQuizCompleted = (videoId: string) => {
    const quizStatus = quizCompletions.find(q => q.video_id === videoId);
    return quizStatus?.completed || false;
  };

  const isVideoFullyCompleted = (videoId: string) => {
    return isVideoCompleted(videoId) && isQuizCompleted(videoId);
  };

  const isModuleCompleted = (module: Module) => {
    const moduleCompletion = moduleCompletions.find(mc => mc.module_id === module.id);
    return !!moduleCompletion?.completed_at;
  };

  const isModuleUnlocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return true;
    
    const previousModule = modules[moduleIndex - 1];
    return previousModule ? isModuleCompleted(previousModule) : false;
  };

  const isVideoUnlocked = (moduleIndex: number, videoIndex: number) => {
    if (!isModuleUnlocked(moduleIndex)) return false;
    if (videoIndex === 0) return true;
    
    const module = modules[moduleIndex];
    const previousVideo = module.videos[videoIndex - 1];
    return previousVideo ? isVideoFullyCompleted(previousVideo.id) : false;
  };

  const handleVideoComplete = async (videoId: string) => {
    await fetchVideoProgress();
    await fetchQuizCompletions();
    
    const moduleIndex = modules.findIndex(module => 
      module.videos.some(video => video.id === videoId)
    );
    
    if (moduleIndex !== -1) {
      const module = modules[moduleIndex];
      if (isModuleCompleted(module)) {
        try {
          await supabase
            .from('student_achievements')
            .insert({
              student_id: student!.id,
              module_id: module.id,
              achievement_type: 'module_completion'
            });

          await supabase
            .from('notifications')
            .insert({
              student_id: student!.id,
              title: 'تهانينا! مودول مكتمل',
              message: `لقد أكملت مودول "${module.title}" بنجاح`,
              type: 'success'
            });
        } catch (error) {
          console.error('Error creating achievement:', error);
        }
      }
    }
  };

  const getOverallProgress = () => {
    const totalVideos = modules.reduce((sum, module) => sum + module.videos.length, 0);
    const completedVideos = modules.reduce((sum, module) => 
      sum + module.videos.filter(video => isVideoFullyCompleted(video.id)).length, 0
    );
    
    return totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
  };

  const getModuleProgress = (module: Module) => {
    const completedVideos = module.videos.filter(video => isVideoFullyCompleted(video.id)).length;
    return module.videos.length > 0 ? Math.round((completedVideos / module.videos.length) * 100) : 0;
  };

  const overallProgress = getOverallProgress();
  const completedModulesCount = modules.filter(module => isModuleCompleted(module)).length;
  const totalVideos = modules.reduce((sum, module) => sum + module.videos.length, 0);
  const completedVideos = modules.reduce((sum, module) => 
    sum + module.videos.filter(video => isVideoFullyCompleted(video.id)).length, 0
  );

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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowRight size={16} />
                العودة للوحة التحكم
              </Button>
              <h1 className="text-2xl font-bold text-slate-900 arabic-heading">
                {course?.title}
              </h1>
            </div>
            <Badge variant="outline" className="arabic-text">
              التقدم: {overallProgress}%
            </Badge>
          </div>
        </div>
      </div>

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
            onVideoComplete={handleVideoComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseView;
