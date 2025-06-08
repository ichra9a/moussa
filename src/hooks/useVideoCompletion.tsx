
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVideoCompletion = (
  student: any,
  video: any,
  watchedSufficientTime: boolean,
  watchTime: number,
  completionPercentage: number,
  duration: number,
  onVideoComplete: (videoId: string) => void
) => {
  const { toast } = useToast();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

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
      // Mark video as completed in database
      await supabase
        .from('student_video_progress')
        .upsert({
          student_id: student.id,
          video_id: video.id,
          watch_time: Math.max(watchTime, Math.floor(duration * 0.7)),
          completion_percentage: Math.max(completionPercentage, 70),
          completed_at: new Date().toISOString()
        });

      // Check if there are verification questions
      const { data: questions } = await supabase
        .from('video_verification_questions')
        .select('id')
        .eq('video_id', video.id);

      if (questions && questions.length > 0) {
        // Check if quiz is already completed
        const { data: answers } = await supabase
          .from('student_verification_answers')
          .select('is_correct')
          .eq('student_id', student.id)
          .in('question_id', questions.map(q => q.id));

        const allAnsweredCorrectly = answers && 
          answers.length === questions.length && 
          answers.every(answer => answer.is_correct);

        if (allAnsweredCorrectly) {
          setQuizCompleted(true);
          toast({
            title: "تهانينا! 🎉",
            description: "لقد أكملت مشاهدة هذا الفيديو بنجاح",
          });
          onVideoComplete(video.id);
        } else {
          setShowQuiz(true);
          toast({
            title: "تهانينا!",
            description: "الآن يجب الإجابة على أسئلة التحقق لإلغاء قفل الفيديو التالي",
          });
        }
      } else {
        // No quiz required, mark as completed
        setQuizCompleted(true);
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
    toast({
      title: "تهانينا! 🎉",
      description: "لقد أكملت الفيديو والاختبار بنجاح. يمكنك الآن مشاهدة الفيديو التالي",
    });
    onVideoComplete(video.id);
  };

  return {
    showQuiz,
    setShowQuiz,
    quizCompleted,
    setQuizCompleted,
    handleMarkAsComplete,
    handleQuizComplete
  };
};
