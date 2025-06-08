
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
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { Button } from '@/components/ui/button';

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
  const [isModuleCompleted, setIsModuleCompleted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
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

  useEffect(() => {
    if (moduleId && student) {
      checkModuleCompletion();
    }
  }, [moduleId, student]);

  useEffect(() => {
    if (student && video.id) {
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
          if (percentage >= 70) {
            setWatchedSufficientTime(true);
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
  }, [isPlaying, duration, isCompleted]);

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
      }
    } catch (error) {
      console.error('Error checking watched time:', error);
    }
  };

  const checkModuleCompletion = async () => {
    if (!moduleId || !student) return;

    try {
      const { data } = await supabase
        .from('module_subscriptions')
        .select('completed_at')
        .eq('student_id', student.id)
        .eq('module_id', moduleId)
        .maybeSingle();

      setIsModuleCompleted(!!data?.completed_at);
    } catch (error) {
      console.error('Error checking module completion:', error);
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

  const handleMarkAsComplete = async () => {
    if (!student || !watchedSufficientTime) {
      toast({
        title: "تحذير",
        description: "يجب مشاهدة 70% على الأقل من الفيديو قبل تحديده كمكتمل",
        variant: "destructive"
      });
      return;
    }

    try {
      await supabase
        .from('student_video_progress')
        .upsert({
          student_id: student.id,
          video_id: video.id,
          watch_time: Math.max(watchTime, Math.floor(duration * 0.7)),
          completion_percentage: Math.max(completionPercentage, 70),
          completed_at: new Date().toISOString()
        });

      setIsCompleted(true);
      setCompletionPercentage(100);

      // Check if there are verification questions
      const { data: questions } = await supabase
        .from('video_verification_questions')
        .select('id')
        .eq('video_id', video.id);

      if (questions && questions.length > 0 && !quizCompleted) {
        setShowQuiz(true);
        toast({
          title: "تهانينا!",
          description: "الآن يجب الإجابة على أسئلة التحقق لإلغاء قفل الفيديو التالي",
        });
      } else {
        toast({
          title: "تهانينا! 🎉",
          description: "لقد أكملت مشاهدة هذا الفيديو بنجاح",
        });
        onVideoComplete(video.id);
      }
    } catch (error) {
      console.error('Error marking video complete:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الفيديو",
        variant: "destructive"
      });
    }
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    setShowQuiz(false);
    onVideoComplete(video.id);
  };

  const handleModuleComplete = async () => {
    if (!moduleId || !student) return;

    try {
      await supabase
        .from('module_subscriptions')
        .upsert({
          student_id: student.id,
          module_id: moduleId,
          progress: 100,
          completed_at: new Date().toISOString()
        });

      setIsModuleCompleted(true);

      toast({
        title: "تهانينا! 🎉",
        description: "لقد أكملت هذه الوحدة بنجاح! يمكنك الآن الوصول للوحدة التالية",
      });

      window.location.reload();
    } catch (error) {
      console.error('Error marking module complete:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديد الوحدة كمكتملة",
        variant: "destructive"
      });
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading flex items-center gap-2">
            {isCompleted && quizCompleted ? (
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
            isCompleted={isCompleted}
            isLocked={isLocked}
            onPlayPause={handlePlayPause}
            onRestart={handleRestart}
          />

          {/* Mark as Complete Button */}
          {!isCompleted && watchedSufficientTime && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-800 arabic-text">جاهز لتحديد الفيديو كمكتمل؟</h4>
                  <p className="text-sm text-green-600 arabic-text mt-1">
                    لقد شاهدت ما يكفي من الفيديو. اضغط لتحديده كمكتمل والانتقال للخطوة التالية.
                  </p>
                </div>
                <Button
                  onClick={handleMarkAsComplete}
                  className="bg-green-600 hover:bg-green-700 text-white arabic-text"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  تحديد كمكتمل
                </Button>
              </div>
            </div>
          )}

          {!watchedSufficientTime && !isCompleted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 arabic-text text-sm">
                شاهد 70% على الأقل من الفيديو لتتمكن من تحديده كمكتمل
              </p>
            </div>
          )}

          {isLastVideoInModule && isCompleted && quizCompleted && !isModuleCompleted && (
            <ModuleCompletion onComplete={handleModuleComplete} />
          )}
        </CardContent>
      </Card>

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
