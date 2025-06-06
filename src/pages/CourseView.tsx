
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Lock, Award, BookOpen } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';

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

const CourseView = () => {
  const { courseId } = useParams();
  const { student } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
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
            videos (
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
            .map(mv => ({ 
              id: mv.videos.id,
              title: mv.videos.title,
              youtube_id: mv.videos.youtube_id,
              duration_seconds: mv.videos.duration_seconds,
              order_index: mv.order_index 
            }))
            .sort((a, b) => a.order_index - b.order_index)
        }));
        setModules(formattedModules);
      }

      // Fetch video progress
      await fetchVideoProgress();
      
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

  const isVideoCompleted = (videoId: string) => {
    const progress = videoProgress.find(p => p.video_id === videoId);
    return progress?.completed_at !== null && progress?.completion_percentage >= 95;
  };

  const isModuleCompleted = (module: Module) => {
    return module.videos.every(video => isVideoCompleted(video.id));
  };

  const isModuleUnlocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return true;
    
    // Check if previous module is completed
    const previousModule = modules[moduleIndex - 1];
    return previousModule ? isModuleCompleted(previousModule) : false;
  };

  const isVideoUnlocked = (moduleIndex: number, videoIndex: number) => {
    // Module must be unlocked first
    if (!isModuleUnlocked(moduleIndex)) return false;
    
    // First video in module is always unlocked if module is unlocked
    if (videoIndex === 0) return true;
    
    // Previous video in same module must be completed
    const module = modules[moduleIndex];
    const previousVideo = module.videos[videoIndex - 1];
    return previousVideo ? isVideoCompleted(previousVideo.id) : false;
  };

  const handleVideoComplete = async (videoId: string) => {
    await fetchVideoProgress();
    
    // Check if module is now complete
    const moduleIndex = modules.findIndex(module => 
      module.videos.some(video => video.id === videoId)
    );
    
    if (moduleIndex !== -1) {
      const module = modules[moduleIndex];
      if (isModuleCompleted(module)) {
        // Award achievement for module completion
        try {
          await supabase
            .from('student_achievements')
            .insert({
              student_id: student!.id,
              module_id: module.id,
              achievement_type: 'module_completion'
            });

          // Send notification
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
      sum + module.videos.filter(video => isVideoCompleted(video.id)).length, 0
    );
    
    return totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
  };

  const getModuleProgress = (module: Module) => {
    const completedVideos = module.videos.filter(video => isVideoCompleted(video.id)).length;
    return module.videos.length > 0 ? Math.round((completedVideos / module.videos.length) * 100) : 0;
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
      {/* Header */}
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
              التقدم: {getOverallProgress()}%
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Course Progress */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="arabic-heading">تقدمك في الدورة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="arabic-text">التقدم الإجمالي</span>
                      <span>{getOverallProgress()}%</span>
                    </div>
                    <Progress value={getOverallProgress()} className="h-3" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="arabic-text">المودولات المكتملة</span>
                      <span>
                        {modules.filter(module => isModuleCompleted(module)).length} من {modules.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="arabic-text">الفيديوهات المكتملة</span>
                      <span>
                        {modules.reduce((sum, module) => 
                          sum + module.videos.filter(video => isVideoCompleted(video.id)).length, 0
                        )} من {modules.reduce((sum, module) => sum + module.videos.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="arabic-heading">المودولات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {modules.map((module, index) => (
                    <div
                      key={module.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isModuleUnlocked(index) 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isModuleCompleted(module) ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : isModuleUnlocked(index) ? (
                          <BookOpen size={16} className="text-blue-500" />
                        ) : (
                          <Lock size={16} className="text-gray-400" />
                        )}
                        <span className="text-sm font-medium arabic-text">
                          {module.title}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {getModuleProgress(module)}% مكتمل
                      </div>
                      <Progress value={getModuleProgress(module)} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Videos */}
          <div className="lg:col-span-3 space-y-6">
            {modules.map((module, moduleIndex) => (
              <Card key={module.id} className={`${!isModuleUnlocked(moduleIndex) ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="arabic-heading flex items-center gap-3">
                      {!isModuleUnlocked(moduleIndex) && <Lock size={20} className="text-slate-400" />}
                      {isModuleCompleted(module) && <Award size={20} className="text-yellow-500" />}
                      <span>المودول {moduleIndex + 1}: {module.title}</span>
                    </CardTitle>
                    <Badge variant={isModuleCompleted(module) ? 'default' : 'secondary'}>
                      {module.videos.filter(video => isVideoCompleted(video.id)).length}/{module.videos.length} فيديو
                    </Badge>
                  </div>
                  {module.description && (
                    <p className="text-slate-600 arabic-text">{module.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {module.videos.map((video, videoIndex) => (
                    <VideoPlayer
                      key={video.id}
                      video={video}
                      onVideoComplete={handleVideoComplete}
                      isLocked={!isVideoUnlocked(moduleIndex, videoIndex)}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;
