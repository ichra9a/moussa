
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import VideoControls from './video/VideoControls';
import VideoProgress from './video/VideoProgress';
import ModuleCompletion from './video/ModuleCompletion';
import { useVideoProgress } from '@/hooks/useVideoProgress';

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
    if (isPlaying && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          const percentage = duration > 0 ? Math.floor((newTime / duration) * 100) : 0;
          setCompletionPercentage(percentage);
          setWatchTime(prev => prev + 1);
          
          if (percentage >= 95 && !isCompleted) {
            handleVideoComplete();
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

  const handleVideoComplete = async () => {
    if (isCompleted || !student) return;

    setIsCompleted(true);
    setCompletionPercentage(100);
    
    try {
      await supabase
        .from('student_video_progress')
        .upsert({
          student_id: student.id,
          video_id: video.id,
          watch_time: duration,
          completion_percentage: 100,
          completed_at: new Date().toISOString()
        });

      toast({
        title: "تهانينا! 🎉",
        description: "لقد أكملت مشاهدة هذا الفيديو بنجاح",
      });

      onVideoComplete(video.id);
    } catch (error) {
      console.error('Error marking video complete:', error);
    }
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

      // Refresh the page to update module access
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
            <p className="text-gray-500 arabic-text">يجب إكمال الوحدة السابقة أولاً</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="arabic-heading flex items-center gap-2">
          {isCompleted ? (
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

        {isLastVideoInModule && isCompleted && !isModuleCompleted && (
          <ModuleCompletion onComplete={handleModuleComplete} />
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
