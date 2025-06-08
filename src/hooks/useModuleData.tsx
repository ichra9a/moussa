
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VerificationQuestion {
  question_text: string;
  correct_answer: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  duration_seconds: number;
  thumbnail: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  course_id: string;
  is_active: boolean;
  courses: {
    title: string;
  };
  module_videos: Array<{
    id: string;
    order_index: number;
    videos: Video;
  }>;
}

interface Course {
  id: string;
  title: string;
}

export const useModuleData = (propCourses?: Course[]) => {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>(propCourses || []);
  const [loading, setLoading] = useState(true);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          courses!modules_course_id_fkey(title),
          module_videos!module_videos_module_id_fkey(
            id,
            order_index,
            videos!module_videos_video_id_fkey(id, title, youtube_id, duration_seconds, thumbnail)
          )
        `)
        .order('order_index');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الوحدات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    fetchModules();
    if (!propCourses || propCourses.length === 0) {
      fetchCourses();
    }
  }, [propCourses]);

  return {
    modules,
    courses,
    loading,
    fetchModules,
    toast
  };
};
