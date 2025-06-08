
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
    console.log('handleMarkAsComplete called', { 
      student: !!student, 
      watchedSufficientTime, 
      videoId: video.id,
      completionPercentage
    });

    if (!student) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }

    // Require 100% completion
    if (!watchedSufficientTime || completionPercentage < 100) {
      toast({
        title: "تحذير",
        description: "يجب مشاهدة الفيديو كاملاً (100%) قبل تحديده كمكتمل",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Marking video as completed:', video.id);
      
      // Mark video as completed in database with 100% completion
      const { error: progressError } = await supabase
        .from('student_video_progress')
        .upsert({
          student_id: student.id,
          video_id: video.id,
          watch_time: Math.max(watchTime, duration),
          completion_percentage: 100, // Force 100% completion
          completed_at: new Date().toISOString()
        });

      if (progressError) {
        console.error('Error updating video progress:', progressError);
        throw progressError;
      }

      console.log('Video marked as completed, checking for verification questions');

      // Check if there are verification questions
      const { data: questions, error: questionsError } = await supabase
        .from('video_verification_questions')
        .select('id')
        .eq('video_id', video.id);

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        throw questionsError;
      }

      console.log('Found questions:', questions?.length || 0);

      if (questions && questions.length > 0) {
        // Check if quiz is already completed
        const { data: answers, error: answersError } = await supabase
          .from('student_verification_answers')
          .select('is_correct')
          .eq('student_id', student.id)
          .in('question_id', questions.map(q => q.id));

        if (answersError) {
          console.error('Error fetching answers:', answersError);
          throw answersError;
        }

        const allAnsweredCorrectly = answers && 
          answers.length === questions.length && 
          answers.every(answer => answer.is_correct);

        console.log('Quiz status:', { 
          answersCount: answers?.length || 0, 
          questionsCount: questions.length, 
          allCorrect: allAnsweredCorrectly 
        });

        if (allAnsweredCorrectly) {
          setQuizCompleted(true);
          toast({
            title: "تهانينا! 🎉",
            description: "لقد أكملت مشاهدة هذا الفيديو بنجاح",
          });
          onVideoComplete(video.id);
        } else {
          console.log('Showing quiz for video:', video.id);
          setShowQuiz(true);
          toast({
            title: "الفيديو مكتمل!",
            description: "الآن يجب الإجابة على أسئلة التحقق لإلغاء قفل الفيديو التالي",
          });
        }
      } else {
        // No quiz required, mark as completed
        console.log('No questions found, marking video as fully complete');
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
    console.log('Quiz completed for video:', video.id);
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
