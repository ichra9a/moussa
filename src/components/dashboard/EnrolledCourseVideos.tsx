import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import VideoPlayer from '@/components/VideoPlayer';
import VideoCompletionButton from '@/components/video/VideoCompletionButton';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { useVideoCompletion } from '@/hooks/useVideoCompletion';
interface Video {
  id: string;
  title: string;
  youtube_id: string;
  duration_seconds: number;
  order_index: number;
}
interface Course {
  id: string;
  title: string;
  videos: Video[];
}
interface EnrolledCourseVideosProps {
  onVideoSelect?: (video: any) => void;
}
const EnrolledCourseVideos = ({
  onVideoSelect
}: EnrolledCourseVideosProps) => {
  const {
    student
  } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<Record<string, any>>({});
  const fetchEnrolledCourses = async () => {
    if (!student) return;
    try {
      console.log('Fetching courses for student:', student.id, 'pin:', student.pin_code);

      // Get the courses the student is enrolled in
      const {
        data: enrollments,
        error: enrollmentError
      } = await supabase.from('student_enrollments').select('course_id').eq('student_id', student.id).eq('is_active', true);
      console.log('Course enrollments:', enrollments, 'Error:', enrollmentError);
      if (!enrollments || enrollments.length === 0) {
        console.log('No course enrollments found');
        setCourses([]);
        setLoading(false);
        return;
      }
      const enrolledCourseIds = enrollments.map(e => e.course_id);
      console.log('Enrolled course IDs:', enrolledCourseIds);

      // Get course details with videos
      const {
        data: coursesData,
        error: coursesError
      } = await supabase.from('courses').select(`
          id,
          title,
          videos!videos_course_id_fkey (
            id,
            title,
            youtube_id,
            duration_seconds,
            order_index
          )
        `).in('id', enrolledCourseIds).eq('is_active', true);
      console.log('Courses data:', coursesData, 'Error:', coursesError);
      if (coursesData) {
        const formattedCourses = coursesData.map(course => ({
          id: course.id,
          title: course.title,
          videos: (course.videos || []).filter(video => video !== null).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        })).filter(course => course.videos.length > 0);
        console.log('Formatted courses:', formattedCourses);
        setCourses(formattedCourses);
      }
      await fetchVideoProgress();
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchVideoProgress = async () => {
    if (!student) return;
    try {
      const {
        data
      } = await supabase.from('student_video_progress').select('video_id, completion_percentage, completed_at, watch_time').eq('student_id', student.id);
      if (data) {
        const progressMap = data.reduce((acc, progress) => {
          acc[progress.video_id] = progress;
          return acc;
        }, {} as Record<string, any>);
        setVideoProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching video progress:', error);
    }
  };
  const isVideoCompleted = (videoId: string) => {
    const progress = videoProgress[videoId];
    return progress?.completed_at !== null && progress?.completion_percentage >= 70;
  };
  const isVideoUnlocked = (course: Course, videoIndex: number) => {
    // First video is always unlocked
    if (videoIndex === 0) return true;

    // Check if previous video is completed
    const previousVideo = course.videos[videoIndex - 1];
    return isVideoCompleted(previousVideo.id);
  };
  const onVideoComplete = async (videoId: string) => {
    await fetchVideoProgress();
  };
  const VideoItem = ({
    video,
    course,
    videoIndex
  }: {
    video: Video;
    course: Course;
    videoIndex: number;
  }) => {
    const isUnlocked = isVideoUnlocked(course, videoIndex);
    const isCompleted = isVideoCompleted(video.id);
    const progress = videoProgress[video.id];
    const completionPercentage = progress?.completion_percentage || 0;
    const watchTime = progress?.watch_time || 0;
    const {
      watchTime: currentWatchTime,
      completionPercentage: currentCompletionPercentage,
      isCompleted: isVideoProgressCompleted
    } = useVideoProgress(video.id);
    const watchedSufficientTime = (currentCompletionPercentage || completionPercentage) >= 70;
    const {
      handleMarkAsComplete
    } = useVideoCompletion(student, video, watchedSufficientTime, currentWatchTime || watchTime, currentCompletionPercentage || completionPercentage, video.duration_seconds || 0, onVideoComplete);
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return <div className="border rounded-lg p-4 space-y-3 px-0 mx-0 py-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isUnlocked && <Lock size={16} className="text-slate-400" />}
            {isCompleted && <CheckCircle size={16} className="text-green-500" />}
            <h4 className="font-medium arabic-text">{video.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {video.duration_seconds && <span className="text-sm text-gray-500">
                {formatTime(video.duration_seconds)}
              </span>}
            <Button onClick={() => {
            if (isUnlocked) {
              setExpandedVideo(expandedVideo === video.id ? null : video.id);
            }
          }} disabled={!isUnlocked} variant="outline" size="sm" className={`${!isUnlocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
              <Play size={16} />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {(currentCompletionPercentage || completionPercentage) > 0 && <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>التقدم</span>
              <span>{currentCompletionPercentage || completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{
            width: `${currentCompletionPercentage || completionPercentage}%`
          }} />
            </div>
          </div>}

        {/* Video Completion Button */}
        <VideoCompletionButton watchedSufficientTime={watchedSufficientTime} isCompleted={isCompleted} onMarkAsComplete={handleMarkAsComplete} />

        {/* Expanded Video Player */}
        {expandedVideo === video.id && isUnlocked && <div className="mt-4">
            <VideoPlayer video={video} onVideoComplete={onVideoComplete} isLocked={false} moduleId={course.id} isLastVideoInModule={videoIndex === course.videos.length - 1} />
          </div>}
      </div>;
  };
  useEffect(() => {
    if (student) {
      fetchEnrolledCourses();
    }
  }, [student]);
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">الكورسات المسجل بها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 arabic-text">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="arabic-heading">الكورسات المسجل بها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {courses.length === 0 ? <div className="text-center py-8">
            <p className="text-gray-500 arabic-text">لم يتم العثور على كورسات مسجل بها</p>
            <p className="text-sm text-gray-400 arabic-text mt-2">تأكد من تسجيلك في الكورسات</p>
          </div> : courses.map(course => {
        const completedVideos = course.videos.filter(video => isVideoCompleted(video.id)).length;
        return <div key={course.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold arabic-heading">{course.title}</h3>
                  <Badge variant="secondary">
                    {completedVideos}/{course.videos.length} فيديو
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {course.videos.map((video, videoIndex) => <VideoItem key={video.id} video={video} course={course} videoIndex={videoIndex} />)}
                </div>
              </div>;
      })}
      </CardContent>
    </Card>;
};
export default EnrolledCourseVideos;