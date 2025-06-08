
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
  maxPreviewTime?: number;
  onPreviewEnd?: () => void;
}

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VideoPlayer = ({ 
  video, 
  onVideoComplete, 
  isLocked = false, 
  moduleId,
  isLastVideoInModule = false,
  maxPreviewTime,
  onPreviewEnd
}: VideoPlayerProps) => {
  const { student } = useAuth();
  const { toast } = useToast();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration_seconds || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedSufficientTime, setWatchedSufficientTime] = useState(false);
  const [ytPlayerReady, setYtPlayerReady] = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);
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

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [video.youtube_id]);

  const initializePlayer = () => {
    if (containerRef.current && !isLocked) {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: video.youtube_id,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 0,
          disablekb: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          fs: 0,
          autohide: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });
    }
  };

  const onPlayerReady = (event: any) => {
    setYtPlayerReady(true);
    const playerDuration = event.target.getDuration();
    if (playerDuration) {
      setDuration(playerDuration);
    }
  };

  const onPlayerStateChange = (event: any) => {
    const playerState = event.data;
    
    if (playerState === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startTracking();
    } else if (playerState === window.YT.PlayerState.PAUSED || 
               playerState === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      stopTracking();
    }

    // Check if video ended (100% completion required for enrolled users)
    if (playerState === window.YT.PlayerState.ENDED) {
      if (!maxPreviewTime) {
        setCompletionPercentage(100);
        setWatchedSufficientTime(true);
        toast({
          title: "اكتمل المشاهدة!",
          description: "لقد شاهدت الفيديو كاملاً. يمكنك الآن تحديده كمكتمل",
        });
      }
    }
  };

  const startTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        const videoDuration = playerRef.current.getDuration() || duration;
        
        // Check preview time limit
        if (maxPreviewTime && current >= maxPreviewTime && !previewEnded) {
          setPreviewEnded(true);
          playerRef.current.pauseVideo();
          if (onPreviewEnd) {
            onPreviewEnd();
          }
          toast({
            title: "انتهت المعاينة المجانية",
            description: `لقد شاهدت ${Math.floor(maxPreviewTime / 60)} دقائق من الفيديو`,
            variant: "default"
          });
          return;
        }
        
        setCurrentTime(current);
        
        let percentage;
        if (maxPreviewTime) {
          // For preview, calculate percentage based on preview time
          percentage = videoDuration > 0 ? Math.floor((current / Math.min(maxPreviewTime, videoDuration)) * 100) : 0;
        } else {
          // For full access, calculate percentage based on full duration
          percentage = videoDuration > 0 ? Math.floor((current / videoDuration) * 100) : 0;
        }
        
        setCompletionPercentage(Math.min(percentage, 100));
        setWatchTime(prev => prev + 1);
        
        // Only allow completion for enrolled users (no maxPreviewTime)
        if (!maxPreviewTime && percentage >= 100 && !watchedSufficientTime) {
          setWatchedSufficientTime(true);
          console.log('Student has watched 100% of the video, completion button should appear');
        }
        
        if (Math.floor(current) % 10 === 0) {
          saveProgress(Math.floor(current), percentage);
        }
      }
    }, 1000);
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    if (student && video.id) {
      checkVideoCompletionStatus();
      checkQuizStatus();
      checkWatchedTime();
    }
  }, [student, video.id]);

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

      if (data && data.completion_percentage >= 100) {
        setWatchedSufficientTime(true);
        console.log('Student has already watched full video:', video.id);
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
        description: "يجب الاشتراك في الدورة أولاً",
        variant: "destructive"
      });
      return;
    }

    if (previewEnded) {
      toast({
        title: "انتهت المعاينة",
        description: "اشترك في الدورة لمتابعة المشاهدة",
        variant: "destructive"
      });
      return;
    }

    if (!ytPlayerReady || !playerRef.current) {
      toast({
        title: "الفيديو غير جاهز",
        description: "انتظر حتى يتم تحميل الفيديو",
        variant: "destructive"
      });
      return;
    }

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleRestart = () => {
    if (isLocked || !ytPlayerReady || !playerRef.current) return;
    
    playerRef.current.seekTo(0);
    setCurrentTime(0);
    setCompletionPercentage(0);
    setIsPlaying(false);
    setPreviewEnded(false);
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
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 arabic-text">يجب الاشتراك في الدورة لمشاهدة هذا الفيديو</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isVideoFullyComplete = isCompleted && quizCompleted;

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
            {maxPreviewTime && (
              <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
                معاينة مجانية
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video relative">
            <div 
              ref={containerRef}
              className="w-full h-full rounded-lg"
            />
            {previewEnded && (
              <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Lock className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 arabic-heading">انتهت المعاينة المجانية</h3>
                  <p className="arabic-text">اشترك في الدورة لمشاهدة الفيديو كاملاً</p>
                </div>
              </div>
            )}
          </div>

          <VideoProgress
            completionPercentage={completionPercentage}
            currentTime={currentTime}
            duration={maxPreviewTime ? Math.min(maxPreviewTime, duration) : duration}
            watchTime={watchTime}
            maxPreviewTime={maxPreviewTime}
          />

          <VideoControls
            isPlaying={isPlaying}
            isCompleted={isVideoFullyComplete}
            isLocked={isLocked}
            onPlayPause={handlePlayPause}
            onRestart={handleRestart}
            previewEnded={previewEnded}
          />

          {/* Video Completion Button - Only show for enrolled users who watched 100% */}
          {!maxPreviewTime && (
            <VideoCompletionButton
              watchedSufficientTime={watchedSufficientTime}
              isCompleted={isVideoFullyComplete}
              onMarkAsComplete={handleMarkAsComplete}
            />
          )}

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
