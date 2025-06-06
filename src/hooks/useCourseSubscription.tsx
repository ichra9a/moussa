
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useCourseSubscription = () => {
  const { student } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuickEnroll = async (courseId: string, type: 'course' | 'module') => {
    if (!student) {
      toast({
        title: "تسجيل مطلوب",
        description: "يجب تسجيل الدخول أولاً للاشتراك",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      if (type === 'course') {
        const { error } = await supabase
          .from('student_enrollments')
          .insert({
            student_id: student.id,
            course_id: courseId
          });

        if (error && error.code !== '23505') {
          throw error;
        }

        toast({
          title: "تم التسجيل بنجاح",
          description: "تم تسجيلك في الدورة بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('module_subscriptions')
          .insert({
            student_id: student.id,
            module_id: courseId
          });

        if (error && error.code !== '23505') {
          throw error;
        }

        toast({
          title: "تم الاشتراك بنجاح",
          description: "تم اشتراكك في المودول بنجاح",
        });
      }

      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التسجيل",
        variant: "destructive"
      });
    }
  };

  return { handleQuickEnroll };
};
