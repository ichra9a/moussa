import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Lock, CheckCircle, Clock } from 'lucide-react';
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
  modules: Module[];
}

interface EnrolledCourseModulesProps {
  onVideoSelect?: (video: any) => void;
}

const EnrolledCourseModules = ({ onVideoSelect }: EnrolledCourseModulesProps) => {
  const { student } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<Record<string, any>>({});
  const [moduleCompletions, setModuleCompletions] = useState<Record<string, boolean>>({});

  const fetchEnrolledCourses = async () => {
    if (!student) return;

    try {
      // Get enrolled courses with modules and videos
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select(`
          course_id,
          courses!student_enrollments_course_id_fkey (
            id,
            title,
            modules!modules_course_id_fkey (
              id,
              title,
              description,
              order_index,
              module_videos (
                order_index,
                videos!module_videos_video_id_fkey (
                  id,
                  title,
                  youtube_id,
                  duration_seconds
                )
              )
            )
          )
        `)
        .eq('student_id', student.id)
        .eq('is_active', true);

      if (enrollments) {
        const formattedCourses = enrollments.map(enrollment => ({
          id: enrollment.courses.id,
          title: enrollment.courses.title,
          modules: enrollment.courses.modules
            .map(module => ({
              id: module.id,
              title: module.title,
              description: module.description,
              order_index: module.order_index,
              videos: module.module_videos
                .filter(mv => mv.videos)
                .map(mv => ({
                  id: mv.videos.id,
                  title: mv.videos.title,
                  youtube_id: mv.videos.youtube_id,
                  duration_seconds: mv.videos.duration_seconds,
                  order_index: mv.order_index
                }))
                .sort((a, b) => a.order_index - b.order_index)
            }))
            .sort((a, b) => a.order_index - b.order_index)
        }));
        setCourses(formattedCourses);
      }

      // Fetch video progress
      await fetchVideoProgress();
      await fetchModuleCompletions();
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoProgress = async () => {
    if (!student) return;

    try {
      const { data } = await supabase
        .from('student_video_progress')
        .select('video_id, completion_percentage, completed_at, watch_time')
        .eq('student_id', student.id);

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

  const fetchModuleCompletions = async () => {
    if (!student) return;

    try {
      const { data } = await supabase
        .from('module_subscriptions')
        .select('module_id, completed_at')
        .eq('student_id', student.id);

      if (data) {
        const completionsMap = data.reduce((acc, completion) => {
          acc[completion.module_id] = !!completion.completed_at;
          return acc;
        }, {} as Record<string, boolean>);
        setModuleCompletions(completionsMap);
      }
    } catch (error) {
      console.error('Error fetching module completions:', error);
    }
  };

  const isVideoCompleted = (videoId: string) => {
    const progress = videoProgress[videoId];
    return progress?.completed_at !== null && progress?.completion_percentage >= 70;
  };

  const isVideoUnlocked = (course: Course, moduleIndex: number, videoIndex: number) => {
    // First module and first video are always unlocked
    if (moduleIndex === 0 && videoIndex === 0) return true;
    
    // Check if previous video is completed
    if (videoIndex > 0) {
      const module = course.modules[moduleIndex];
      const previousVideo = module.videos[videoIndex - 1];
      return isVideoCompleted(previousVideo.id);
    }
    
    // Check if previous module is completed
    if (moduleIndex > 0) {
      const previousModule = course.modules[moduleIndex - 1];
      return moduleCompletions[previousModule.id];
    }
    
    return false;
  };

  const onVideoComplete = async (videoId: string) => {
    await fetchVideoProgress();
    await fetchModuleCompletions();
  };

  const VideoItem = ({ 
    video, 
    course, 
    moduleIndex, 
    videoIndex, 
    moduleId 
  }: { 
    video: Video; 
    course: Course; 
    moduleIndex: number; 
    videoIndex: number;
    moduleId: string;
  }) => {
    const isUnlocked = isVideoUnlocked(course, moduleIndex, videoIndex);
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
    } = useVideoCompletion(
      student,
      video,
      watchedSufficientTime,
      currentWatchTime || watchTime,
      currentCompletionPercentage || completionPercentage,
      video.duration_seconds || 0,
      onVideoComplete
    );

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isUnlocked && <Lock size={16} className="text-slate-400" />}
            {isCompleted && <CheckCircle size={16} className="text-green-500" />}
            <h4 className="font-medium arabic-text">{video.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {video.duration_seconds && (
              <span className="text-sm text-gray-500">
                {formatTime(video.duration_seconds)}
              </span>
            )}
            <Button
              onClick={() => {
                if (isUnlocked) {
                  setExpandedVideo(expandedVideo === video.id ? null : video.id);
                }
              }}
              disabled={!isUnlocked}
              variant="outline"
              size="sm"
              className={`${
                !isUnlocked 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              <Play size={16} />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {(currentCompletionPercentage || completionPercentage) > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>التقدم</span>
              <span>{currentCompletionPercentage || completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${currentCompletionPercentage || completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Video Completion Button - Always visible */}
        <VideoCompletionButton
          watchedSufficientTime={watchedSufficientTime}
          isCompleted={isCompleted}
          onMarkAsComplete={handleMarkAsComplete}
        />

        {/* Expanded Video Player */}
        {expandedVideo === video.id && isUnlocked && (
          <div className="mt-4">
            <VideoPlayer
              video={video}
              onVideoComplete={onVideoComplete}
              isLocked={false}
              moduleId={moduleId}
              isLastVideoInModule={videoIndex === course.modules.find(m => m.id === moduleId)?.videos.length! - 1}
            />
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (student) {
      fetchEnrolledCourses();
    }
  }, [student]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">الكورسات المسجل بها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 arabic-text">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="arabic-heading">الكورسات المسجل بها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {courses.length === 0 ? (
          <p className="text-gray-500 text-center arabic-text">لم يتم التسجيل في أي كورس بعد</p>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="space-y-4">
              <h3 className="text-lg font-semibold arabic-heading">{course.title}</h3>
              {course.modules.map((module, moduleIndex) => {
                const completedVideos = module.videos.filter(video => isVideoCompleted(video.id)).length;
                
                return (
                  <div key={module.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium arabic-heading">
                        المودول {moduleIndex + 1}: {module.title}
                      </h4>
                      <Badge variant={moduleCompletions[module.id] ? 'default' : 'secondary'}>
                        {completedVideos}/{module.videos.length} فيديو
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {module.videos.map((video, videoIndex) => (
                        <VideoItem
                          key={video.id}
                          video={video}
                          course={course}
                          moduleIndex={moduleIndex}
                          videoIndex={videoIndex}
                          moduleId={module.id}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default EnrolledCourseModules;
