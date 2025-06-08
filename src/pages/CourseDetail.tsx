
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, Play, Clock, Users, CheckCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/VideoPlayer';

interface Video {
  id: string;
  title: string;
  duration_seconds: number;
  youtube_id: string;
  order_index: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  videos: Video[];
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
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

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

      // Fetch all videos directly from the course
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('id, title, youtube_id, duration_seconds, order_index')
        .eq('course_id', courseId)
        .order('order_index');

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        return;
      }

      if (videosData) {
        setAllVideos(videosData);
        // Set first video as selected by default
        if (videosData.length > 0) {
          setSelectedVideo(videosData[0].id);
        }
      }

      // Fetch modules with videos (for display purposes)
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
              youtube_id: mv.videos!.youtube_id,
              order_index: mv.order_index || 0
            }))
            ?.sort((a, b) => a.order_index - b.order_index) || []
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
    const totalSeconds = allVideos.reduce((sum, video) => sum + video.duration_seconds, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${minutes} دقيقة`;
  };

  const selectedVideoData = allVideos.find(v => v.id === selectedVideo);
  const isFirstVideo = selectedVideoData && allVideos[0]?.id === selectedVideoData.id;

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
          {/* Course Info and Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Info */}
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
                        <span className="arabic-text">{allVideos.length} فيديو</span>
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

            {/* Video Player */}
            {selectedVideoData && (
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-heading">معاينة الفيديو</CardTitle>
                  {!isEnrolled && !isFirstVideo && (
                    <p className="text-sm text-amber-600 arabic-text">
                      هذا الفيديو متاح للمشتركين فقط
                    </p>
                  )}
                  {!isEnrolled && isFirstVideo && (
                    <p className="text-sm text-blue-600 arabic-text">
                      معاينة مجانية - دقيقتان فقط
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <VideoPlayer
                    video={selectedVideoData}
                    onVideoComplete={() => {}}
                    isLocked={!isEnrolled && !isFirstVideo}
                    maxPreviewTime={!isEnrolled && isFirstVideo ? 120 : undefined}
                    onPreviewEnd={() => {
                      toast({
                        title: "انتهت المعاينة المجانية",
                        description: "اشترك في الدورة لمشاهدة الفيديو كاملاً",
                        variant: "default"
                      });
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* All Videos List */}
            <Card>
              <CardHeader>
                <CardTitle className="arabic-heading">جميع فيديوهات الدورة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allVideos.map((video, index) => (
                    <div 
                      key={video.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedVideo === video.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedVideo(video.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {!isEnrolled && index > 0 ? (
                            <div className="w-16 h-12 bg-gray-300 rounded flex items-center justify-center">
                              <Lock className="h-4 w-4 text-gray-600" />
                            </div>
                          ) : (
                            <div className="w-16 h-12 bg-blue-100 rounded flex items-center justify-center">
                              <Play className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {index === 0 && !isEnrolled && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded">
                              مجاني
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium arabic-text">{video.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(video.duration_seconds)}</span>
                            {!isEnrolled && index > 0 && (
                              <Badge variant="secondary" className="arabic-text text-xs">
                                مقفل
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                      <div className="mb-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-amber-800 arabic-text">
                            يمكنك مشاهدة دقيقتين من الفيديو الأول مجاناً
                          </p>
                        </div>
                      </div>
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
                        ستحصل على وصول فوري لجميع الفيديوهات
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
