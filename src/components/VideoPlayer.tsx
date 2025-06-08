
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import VideoControls from './video/VideoControls';
import VideoProgress from './video/VideoProgress';
import ModuleCompletion from './video/ModuleCompletion';
import VideoVerificationQuiz from './video/VideoVerificationQuiz';
import VideoCompletionButton from './video/VideoCompletionButton';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { useVideoCompletion } from '@/hooks/useVideoCompletion';
import { useModuleCompletion } from '@/hooks/useModuleCompletion';

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  duration_seconds: number;
}

interface VideoPlayerProps {
  video: Video;
  onVideoComplete: (videoId: string) => void;
  isLocked?: boolean;
  moduleId?: string;
  isLastVideoInModule?: boolean;
}

const VideoPlayer = ({ 
  video, 
  onVideoComplete, 
  isLocked = false, 
  moduleId,
  isLastVideoInModule = false 
}: VideoPlayerProps) => {
  const { student } = useAuth();
  const { toast } = useToast();
  const playerRef = useRef<HTMLIFrameElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration_seconds || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedSufficientTime, setWatchedSufficientTime] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const {
    watchTime,
    setWatchTime,
    completionPercentage,
    setCompletionPercentage,
    isCompleted,
    setIsCompleted,
    saveProgress
  } = useVideoProgress(video.id);

  const {
    showQuiz,
    quizCompleted,
    setQuizCompleted,
    handleMarkAsComplete,
    handleQuizComplete
  } = useVideoCompletion(
    student,
    video,
    watchedSufficientTime,
    watchTime,
    completionPercentage,
    duration,
    onVideoComplete
  );

  const { isModuleCompleted, handleModuleComplete } = useModuleCompletion(student, moduleId);

  useEffect(() => {
    if (student && video.id) {
      checkVideoCompletionStatus();
      checkQuizStatus();
      checkWatchedTime();
    }
  }, [student, video.id]);

  useEffect(() => {
    if (isPlaying && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          const percentage = duration > 0 ? Math.floor((newTime / duration) * 100) : 0;
          setCompletionPercentage(percentage);
          setWatchTime(prev => prev + 1);
          
          // Check if user has watched at least 70% of the video
          if (percentage >= 70 && !watchedSufficientTime) {
            setWatchedSufficientTime(true);
            console.log('Student has watched 70% of the video, completion button should appear');
            toast({
              title: "جاهز للإكمال!",
              description: "لقد شاهدت 70% من الفيديو. يمكنك الآن تحديده كمكتمل",
            });
          }
          
          if (newTime % 10 === 0) {
            saveProgress(newTime, percentage);
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, duration, isCompleted, watchedSufficientTime]);

  const checkVideoCompletionStatus = async () => {
    if (!student || !video.id) return;

    try {
      const { data } = await supabase
        .from('student_video_progress')
        .select('completed_at, completion_percentage')
        .eq('student_id', student.id)
        .eq('video_id', video.id)
        .maybeSingle();

      if (data && data.completed_at) {
        setIsCompleted(true);
        setCompletionPercentage(data.completion_percentage || 100);
        console.log('Video already completed:', video.id);
      }
    } catch (error) {
      console.error('Error checking video completion status:', error);
    }
  };

  const checkWatchedTime = async () => {
    if (!student || !video.id) return;

    try {
      const { data } = await supabase
        .from('student_video_progress')
        .select('completion_percentage')
        .eq('student_id', student.id)
        .eq('video_id', video.id)
        .maybeSingle();

      if (data && data.completion_percentage >= 70) {
        setWatchedSufficientTime(true);
        console.log('Student has already watched sufficient time for video:', video.id);
      }
    } catch (error) {
      console.error('Error checking watched time:', error);
    }
  };

  const checkQuizStatus = async () => {
    if (!student || !video.id) return;

    try {
      const { data: questions } = await supabase
        .from('video_verification_questions')
        .select('id')
        .eq('video_id', video.id);

      if (questions && questions.length > 0) {
        const { data: answers } = await supabase
          .from('student_verification_answers')
          .select('is_correct')
          .eq('student_id', student.id)
          .in('question_id', questions.map(q => q.id));

        const allAnsweredCorrectly = answers && 
          answers.length === questions.length && 
          answers.every(answer => answer.is_correct);

        setQuizCompleted(allAnsweredCorrectly || false);
      } else {
        setQuizCompleted(true);
      }
    } catch (error) {
      console.error('Error checking quiz status:', error);
    }
  };

  const handlePlayPause = () => {
    if (isLocked) {
      toast({
        title: "الفيديو مقفل",
        description: "يجب إكمال الفيديوهات السابقة أولاً",
        variant: "destructive"
      });
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    if (isLocked) return;
    setCurrentTime(0);
    setCompletionPercentage(0);
    setIsPlaying(false);
  };

  if (isLocked) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="arabic-heading flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            {video.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 arabic-text">يجب إكمال الفيديو السابق أولاً</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isVideoFullyComplete = isCompleted && quizCompleted;

  console.log('Video Player State:', {
    videoId: video.id,
    watchedSufficientTime,
    isCompleted,
    quizCompleted,
    completionPercentage,
    showQuiz
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading flex items-center gap-2">
            {isVideoFullyComplete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <div className="w-5 h-5 bg-blue-500 rounded-full" />
            )}
            {video.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video relative">
            <iframe
              ref={playerRef}
              src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?enablejsapi=1&modestbranding=1&rel=0&showinfo=0&controls=1&disablekb=1&iv_load_policy=3&cc_load_policy=0&fs=1&autohide=1`}
              className="w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          </div>

          <VideoProgress
            completionPercentage={completionPercentage}
            currentTime={currentTime}
            duration={duration}
            watchTime={watchTime}
          />

          <VideoControls
            isPlaying={isPlaying}
            isCompleted={isVideoFullyComplete}
            isLocked={isLocked}
            onPlayPause={handlePlayPause}
            onRestart={handleRestart}
          />

          {/* Video Completion Button - Always render, it handles its own visibility */}
          <VideoCompletionButton
            watchedSufficientTime={watchedSufficientTime}
            isCompleted={isVideoFullyComplete}
            onMarkAsComplete={handleMarkAsComplete}
          />

          {isLastVideoInModule && isVideoFullyComplete && !isModuleCompleted && (
            <ModuleCompletion onComplete={handleModuleComplete} />
          )}
        </CardContent>
      </Card>

      {/* Video Verification Quiz */}
      {showQuiz && (
        <VideoVerificationQuiz
          videoId={video.id}
          onQuizComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
