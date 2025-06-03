
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, CheckCircle, Lock, FileText, Award } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  videos: Array<{
    id: string;
    title: string;
    youtube_url: string;
    youtube_id: string;
    thumbnail: string;
    order_index: number;
  }>;
  exam?: {
    id: string;
    title: string;
    description: string;
    questions: any[];
  };
}

const CourseView = () => {
  const { courseId } = useParams();
  const { student } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student && courseId) {
      fetchCourseData();
    }
  }, [student, courseId]);

  const fetchCourseData = async () => {
    if (!student || !courseId) return;

    // Fetch course details
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseData) {
      setCourse(courseData);
    }

    // Fetch modules with videos and exams
    const { data: modulesData } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        description,
        order_index,
        module_videos (
          id,
          order_index,
          videos (
            id,
            title,
            youtube_url,
            youtube_id,
            thumbnail
          )
        ),
        exams (
          id,
          title,
          description,
          questions
        )
      `)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('order_index');

    if (modulesData) {
      const formattedModules = modulesData.map(module => ({
        ...module,
        videos: module.module_videos
          .map(mv => ({ ...mv.videos, order_index: mv.order_index }))
          .sort((a, b) => a.order_index - b.order_index),
        exam: module.exams?.[0] || null
      }));
      setModules(formattedModules);
    }

    // Fetch student progress
    await fetchProgress();
    setLoading(false);
  };

  const fetchProgress = async () => {
    if (!student) return;

    // Video progress
    const { data: videoProgress } = await supabase
      .from('student_video_progress')
      .select('video_id, completed_at')
      .eq('student_id', student.id);

    // Exam submissions
    const { data: examSubmissions } = await supabase
      .from('exam_submissions')
      .select('exam_id, status, grade')
      .eq('student_id', student.id);

    setProgress({
      videos: videoProgress || [],
      exams: examSubmissions || []
    });
  };

  const markVideoComplete = async (videoId: string) => {
    if (!student) return;

    await supabase
      .from('student_video_progress')
      .upsert({
        student_id: student.id,
        video_id: videoId,
        completed_at: new Date().toISOString()
      });

    fetchProgress();
  };

  const isVideoCompleted = (videoId: string) => {
    return progress.videos?.some((v: any) => v.video_id === videoId && v.completed_at);
  };

  const isModuleUnlocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return true;
    
    const previousModule = modules[moduleIndex - 1];
    if (!previousModule) return false;

    // Check if all videos in previous module are completed
    const allVideosCompleted = previousModule.videos.every(video => 
      isVideoCompleted(video.id)
    );

    // Check if exam is passed (if exists)
    let examPassed = true;
    if (previousModule.exam) {
      const submission = progress.exams?.find((e: any) => e.exam_id === previousModule.exam.id);
      examPassed = submission?.status === 'passed';
    }

    return allVideosCompleted && examPassed;
  };

  const getModuleProgress = (module: Module) => {
    const completedVideos = module.videos.filter(video => isVideoCompleted(video.id)).length;
    const totalVideos = module.videos.length;
    
    let examStatus = 'not_taken';
    if (module.exam) {
      const submission = progress.exams?.find((e: any) => e.exam_id === module.exam.id);
      examStatus = submission?.status || 'not_taken';
    }

    return {
      videosCompleted: completedVideos,
      totalVideos,
      examStatus,
      canTakeExam: completedVideos === totalVideos,
      isComplete: completedVideos === totalVideos && (examStatus === 'passed' || !module.exam)
    };
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2 space-y-6">
            {modules.map((module, moduleIndex) => {
              const moduleProgress = getModuleProgress(module);
              const isUnlocked = isModuleUnlocked(moduleIndex);

              return (
                <Card key={module.id} className={`${!isUnlocked ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="arabic-heading flex items-center gap-3">
                        {!isUnlocked && <Lock size={20} className="text-slate-400" />}
                        {moduleProgress.isComplete && <CheckCircle size={20} className="text-green-500" />}
                        <span>الوحدة {moduleIndex + 1}: {module.title}</span>
                      </CardTitle>
                      <Badge variant={moduleProgress.isComplete ? 'default' : 'secondary'}>
                        {moduleProgress.videosCompleted}/{moduleProgress.totalVideos} فيديو
                      </Badge>
                    </div>
                    {module.description && (
                      <p className="text-slate-600 arabic-text">{module.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Videos */}
                    <div className="space-y-3">
                      {module.videos.map((video, videoIndex) => (
                        <div key={video.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            {isVideoCompleted(video.id) ? (
                              <CheckCircle size={20} className="text-green-500" />
                            ) : isUnlocked ? (
                              <Play size={20} className="text-blue-500" />
                            ) : (
                              <Lock size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold arabic-text">{video.title}</h4>
                          </div>
                          {isUnlocked && (
                            <Button
                              size="sm"
                              variant={isVideoCompleted(video.id) ? "outline" : "default"}
                              onClick={() => {
                                // Open video modal or navigate to video page
                                if (!isVideoCompleted(video.id)) {
                                  markVideoComplete(video.id);
                                }
                              }}
                            >
                              {isVideoCompleted(video.id) ? 'مراجعة' : 'مشاهدة'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Exam */}
                    {module.exam && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-blue-600" />
                            <div>
                              <h4 className="font-semibold arabic-text">{module.exam.title}</h4>
                              <p className="text-sm text-slate-600 arabic-text">
                                {moduleProgress.examStatus === 'passed' && 'تم اجتياز الاختبار'}
                                {moduleProgress.examStatus === 'submitted' && 'في انتظار التصحيح'}
                                {moduleProgress.examStatus === 'failed' && 'لم يتم اجتياز الاختبار'}
                                {moduleProgress.examStatus === 'not_taken' && 'لم يتم أداء الاختبار'}
                              </p>
                            </div>
                          </div>
                          <Button
                            disabled={!moduleProgress.canTakeExam || moduleProgress.examStatus === 'submitted'}
                            variant={moduleProgress.examStatus === 'passed' ? 'outline' : 'default'}
                            onClick={() => navigate(`/exam/${module.exam.id}`)}
                          >
                            {moduleProgress.examStatus === 'passed' && 'مراجعة النتيجة'}
                            {moduleProgress.examStatus === 'submitted' && 'في انتظار التصحيح'}
                            {moduleProgress.examStatus === 'failed' && 'إعادة الاختبار'}
                            {moduleProgress.examStatus === 'not_taken' && 'بدء الاختبار'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Progress Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="arabic-heading">تقدمك في الدورة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="arabic-text">التقدم الإجمالي</span>
                      <span>0%</span>
                    </div>
                    <Progress value={0} className="h-3" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="arabic-text">الوحدات المكتملة</span>
                      <span>0 من {modules.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="arabic-text">الفيديوهات المكتملة</span>
                      <span>
                        {progress.videos?.length || 0} من {modules.reduce((total, m) => total + m.videos.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="arabic-heading">معلومات الدورة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="arabic-text text-slate-600">عدد الوحدات</span>
                    <span>{modules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="arabic-text text-slate-600">عدد الفيديوهات</span>
                    <span>{modules.reduce((total, m) => total + m.videos.length, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="arabic-text text-slate-600">عدد الاختبارات</span>
                    <span>{modules.filter(m => m.exam).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;
