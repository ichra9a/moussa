
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, Play, Clock, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  videos: Array<{
    id: string;
    title: string;
    duration_seconds: number;
    youtube_id: string;
  }>;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_active: boolean;
}

const CourseDetail = () => {
  const { courseId } = useParams();
  const { student } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      if (student) {
        checkEnrollment();
      }
    }
  }, [courseId, student]);

  const fetchCourseData = async () => {
    if (!courseId) return;

    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_active', true)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        navigate('/');
        return;
      }

      setCourse(courseData);

      // Fetch modules with videos
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          description,
          order_index,
          module_videos (
            order_index,
            videos!module_videos_video_id_fkey (
              id,
              title,
              duration_seconds,
              youtube_id
            )
          )
        `)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index');

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        return;
      }

      if (modulesData) {
        const formattedModules = modulesData.map(module => ({
          id: module.id,
          title: module.title,
          description: module.description,
          order_index: module.order_index,
          videos: module.module_videos
            ?.filter(mv => mv.videos)
            ?.map(mv => ({
              id: mv.videos!.id,
              title: mv.videos!.title,
              duration_seconds: mv.videos!.duration_seconds || 0,
              youtube_id: mv.videos!.youtube_id
            }))
            ?.sort((a, b) => (module.module_videos?.find(mv => mv.videos?.id === a.id)?.order_index || 0) - 
                             (module.module_videos?.find(mv => mv.videos?.id === b.id)?.order_index || 0)) || []
        }));

        setModules(formattedModules);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!student || !courseId) return;

    try {
      const { data } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', student.id)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .maybeSingle();

      setIsEnrolled(!!data);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!student) {
      toast({
        title: "تسجيل مطلوب",
        description: "يجب تسجيل الدخول أولاً للاشتراك",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: student.id,
          course_id: courseId
        });

      if (error && error.code !== '23505') {
        throw error;
      }

      toast({
        title: "تم التسجيل بنجاح",
        description: "تم تسجيلك في الدورة بنجاح",
      });

      setIsEnrolled(true);
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التسجيل",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleAccessCourse = () => {
    navigate(`/course/${courseId}`);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    const totalSeconds = modules.reduce((sum, module) => 
      sum + module.videos.reduce((moduleSum, video) => moduleSum + video.duration_seconds, 0), 0
    );
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${minutes} دقيقة`;
  };

  const getTotalVideos = () => {
    return modules.reduce((sum, module) => sum + module.videos.length, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="arabic-text text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 arabic-heading mb-4">الدورة غير موجودة</h1>
          <Button onClick={() => navigate('/')} className="arabic-text">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 arabic-text"
            >
              <ArrowRight size={16} />
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <img
                    src={course.thumbnail || '/placeholder.svg'}
                    alt={course.title}
                    className="w-full md:w-64 h-48 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 arabic-heading mb-4">
                      {course.title}
                    </h1>
                    <p className="text-gray-600 arabic-text mb-6 leading-relaxed">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                      <div className="flex items-center gap-1">
                        <BookOpen size={16} />
                        <span className="arabic-text">{modules.length} مودول</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play size={16} />
                        <span className="arabic-text">{getTotalVideos()} فيديو</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span className="arabic-text">{getTotalDuration()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 arabic-heading">محتوى الدورة</h2>
              {modules.map((module, index) => (
                <Card key={module.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 arabic-heading">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{index + 1}</span>
                      </div>
                      {module.title}
                    </CardTitle>
                    {module.description && (
                      <p className="text-gray-600 arabic-text">{module.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {module.videos.map((video, videoIndex) => (
                        <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <Play className="h-3 w-3 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium arabic-text">{video.title}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatDuration(video.duration_seconds)}</span>
                              </div>
                            </div>
                          </div>
                          {!isEnrolled && (
                            <Badge variant="secondary" className="arabic-text">
                              يتطلب التسجيل
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {isEnrolled ? (
                    <>
                      <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                        <CheckCircle size={20} />
                        <span className="arabic-text font-semibold">مسجل في الدورة</span>
                      </div>
                      <Button
                        onClick={handleAccessCourse}
                        className="w-full h-12 text-lg arabic-text"
                        size="lg"
                      >
                        الوصول للدورة
                        <BookOpen size={18} className="mr-2" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 arabic-text"
                        size="lg"
                      >
                        {enrolling ? 'جاري التسجيل...' : 'اشترك في الدورة'}
                        <Users size={18} className="mr-2" />
                      </Button>
                      <p className="text-sm text-gray-500 arabic-text">
                        ستحصل على وصول فوري لجميع المودولات والفيديوهات
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
