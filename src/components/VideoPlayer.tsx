
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

const VideoPlayer = ({ video, onVideoComplete, isLocked = false }: VideoPlayerProps) => {
  const { student } = useAuth();
  const { toast } = useToast();
  const playerRef = useRef<HTMLIFrameElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration_seconds || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (student) {
      fetchVideoProgress();
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
          
          // Auto-complete when 95% watched to account for minor timing issues
          if (percentage >= 95 && !isCompleted) {
            handleVideoComplete();
          }
          
          // Save progress every 10 seconds
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

  const fetchVideoProgress = async () => {
    if (!student) return;

    try {
      const { data } = await supabase
        .from('student_video_progress')
        .select('*')
        .eq('student_id', student.id)
        .eq('video_id', video.id)
        .maybeSingle();

      if (data) {
        setWatchTime(data.watch_time || 0);
        setCompletionPercentage(data.completion_percentage || 0);
        setIsCompleted(!!data.completed_at);
        if (data.completion_percentage >= 95) {
          setCurrentTime(duration);
        }
      }
    } catch (error) {
      console.error('Error fetching video progress:', error);
    }
  };

  const saveProgress = async (currentWatchTime: number, percentage: number) => {
    if (!student) return;

    try {
      await supabase
        .from('student_video_progress')
        .upsert({
          student_id: student.id,
          video_id: video.id,
          watch_time: currentWatchTime,
          completion_percentage: percentage,
          completed_at: percentage >= 95 ? new Date().toISOString() : null
        });
    } catch (error) {
      console.error('Error saving progress:', error);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLocked) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="arabic-heading flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded-full" />
            {video.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 arabic-text">يجب إكمال الفيديوهات السابقة أولاً</p>
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
        {/* Embedded YouTube Player - Restricted */}
        <div className="aspect-video relative">
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${video.youtube_id}?enablejsapi=1&modestbranding=1&rel=0&showinfo=0&controls=1&disablekb=1&iv_load_policy=3`}
            className="w-full h-full rounded-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        </div>

        {/* Progress Tracking */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="arabic-text">التقدم</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handlePlayPause}
            className="arabic-text"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'إيقاف' : 'تشغيل'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRestart}
            className="arabic-text"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة
          </Button>
          {isCompleted && (
            <Button
              size="sm"
              variant="outline"
              className="arabic-text bg-green-50 text-green-700"
              disabled
            >
              <CheckCircle className="h-4 w-4" />
              مكتمل
            </Button>
          )}
        </div>

        {/* Watch Time */}
        <div className="text-sm text-gray-500 arabic-text">
          وقت المشاهدة: {formatTime(watchTime)}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
