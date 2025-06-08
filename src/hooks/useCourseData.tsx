
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  duration_seconds: number;
  order_index: number;
}

interface VideoProgress {
  video_id: string;
  completion_percentage: number;
  completed_at: string | null;
}

interface QuizCompletion {
  video_id: string;
  completed: boolean;
}

export const useCourseData = (student: any, courseId: string | undefined) => {
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [quizCompletions, setQuizCompletions] = useState<QuizCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourseData = async () => {
    if (!student || !courseId) return;

    try {
      // Verify enrollment
      const { data: enrollment } = await supabase
        .from('student_enrollments')
        .select('*')
        .eq('student_id', student.id)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .maybeSingle();

      if (!enrollment) {
        navigate('/dashboard');
        return;
      }

      // Fetch course details
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseData) {
        setCourse(courseData);
      }

      // Fetch videos directly from course
      const { data: videosData } = await supabase
        .from('videos')
        .select('id, title, youtube_id, duration_seconds, order_index')
        .eq('course_id', courseId)
        .order('order_index');

      if (videosData) {
        setVideos(videosData);
      }

      await fetchVideoProgress();
      await fetchQuizCompletions();
      
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoProgress = async () => {
    if (!student) return;

    try {
      const { data } = await supabase
        .from('student_video_progress')
        .select('video_id, completion_percentage, completed_at')
        .eq('student_id', student.id);

      if (data) {
        setVideoProgress(data);
      }
    } catch (error) {
      console.error('Error fetching video progress:', error);
    }
  };

  const fetchQuizCompletions = async () => {
    if (!student) return;

    try {
      // Get all videos from course
      if (videos.length === 0) return;

      // Get all verification questions for these videos
      const { data: questions } = await supabase
        .from('video_verification_questions')
        .select('id, video_id')
        .in('video_id', videos.map(v => v.id));

      if (!questions || questions.length === 0) {
        // No questions exist, mark all videos as quiz completed
        const completions = videos.map(video => ({
          video_id: video.id,
          completed: true
        }));
        setQuizCompletions(completions);
        return;
      }

      // Group questions by video
      const questionsByVideo = questions.reduce((acc, q) => {
        if (!acc[q.video_id]) acc[q.video_id] = [];
        acc[q.video_id].push(q.id);
        return acc;
      }, {} as Record<string, string[]>);

      // Get student answers
      const { data: answers } = await supabase
        .from('student_verification_answers')
        .select('question_id, is_correct')
        .eq('student_id', student.id)
        .in('question_id', questions.map(q => q.id));

      // Calculate completion status for each video
      const completions = videos.map(video => {
        const videoQuestions = questionsByVideo[video.id] || [];
        
        if (videoQuestions.length === 0) {
          return { video_id: video.id, completed: true };
        }

        const videoAnswers = answers?.filter(a => 
          videoQuestions.includes(a.question_id)
        ) || [];

        const completed = videoAnswers.length === videoQuestions.length && 
          videoAnswers.every(a => a.is_correct);

        return { video_id: video.id, completed };
      });

      setQuizCompletions(completions);
    } catch (error) {
      console.error('Error fetching quiz completions:', error);
    }
  };

  useEffect(() => {
    if (student && courseId) {
      fetchCourseData();
    }
  }, [student, courseId]);

  return {
    course,
    modules: [], // Empty since we removed modules
    videos,
    videoProgress,
    moduleCompletions: [], // Empty since we removed modules
    quizCompletions,
    loading,
    fetchVideoProgress,
    fetchQuizCompletions
  };
};
