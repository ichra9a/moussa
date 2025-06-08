
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useVideoProgress = (videoId: string) => {
  const { student } = useAuth();
  const [watchTime, setWatchTime] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (student) {
      fetchVideoProgress();
    }
  }, [student, videoId]);

  const fetchVideoProgress = async () => {
    if (!student) return;

    try {
      const { data } = await supabase
        .from('student_video_progress')
        .select('*')
        .eq('student_id', student.id)
        .eq('video_id', videoId)
        .maybeSingle();

      if (data) {
        setWatchTime(data.watch_time || 0);
        setCompletionPercentage(data.completion_percentage || 0);
        setIsCompleted(!!data.completed_at);
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
          video_id: videoId,
          watch_time: currentWatchTime,
          completion_percentage: percentage,
          completed_at: percentage >= 100 ? new Date().toISOString() : null
        });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  return {
    watchTime,
    setWatchTime,
    completionPercentage,
    setCompletionPercentage,
    isCompleted,
    setIsCompleted,
    saveProgress,
    fetchVideoProgress
  };
};
