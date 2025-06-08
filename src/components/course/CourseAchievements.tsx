
import { supabase } from '@/integrations/supabase/client';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  videos: Array<{
    id: string;
    title: string;
    youtube_id: string;
    duration_seconds: number;
    order_index: number;
  }>;
}

export const handleVideoComplete = async (
  videoId: string,
  modules: Module[],
  student: any,
  isModuleCompleted: (module: Module) => boolean
) => {
  const moduleIndex = modules.findIndex(module => 
    module.videos.some(video => video.id === videoId)
  );
  
  if (moduleIndex !== -1) {
    const module = modules[moduleIndex];
    if (isModuleCompleted(module)) {
      try {
        await supabase
          .from('student_achievements')
          .insert({
            student_id: student!.id,
            module_id: module.id,
            achievement_type: 'module_completion'
          });

        await supabase
          .from('notifications')
          .insert({
            student_id: student!.id,
            title: 'تهانينا! مودول مكتمل',
            message: `لقد أكملت مودول "${module.title}" بنجاح`,
            type: 'success'
          });
      } catch (error) {
        console.error('Error creating achievement:', error);
      }
    }
  }
};
