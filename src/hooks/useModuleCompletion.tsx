
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useModuleCompletion = (student: any, moduleId?: string) => {
  const { toast } = useToast();
  const [isModuleCompleted, setIsModuleCompleted] = useState(false);

  useEffect(() => {
    if (moduleId && student) {
      checkModuleCompletion();
    }
  }, [moduleId, student]);

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

  return {
    isModuleCompleted,
    handleModuleComplete
  };
};
