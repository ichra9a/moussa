
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

interface VideoProgress {
  video_id: string;
  completion_percentage: number;
  completed_at: string | null;
}

interface ModuleCompletion {
  module_id: string;
  completed_at: string | null;
}

interface QuizCompletion {
  video_id: string;
  completed: boolean;
}

export const useCourseProgress = (
  modules: Module[],
  videoProgress: VideoProgress[],
  moduleCompletions: ModuleCompletion[],
  quizCompletions: QuizCompletion[]
) => {
  const isVideoCompleted = (videoId: string) => {
    const progress = videoProgress.find(p => p.video_id === videoId);
    return progress?.completed_at !== null && progress?.completion_percentage >= 70;
  };

  const isQuizCompleted = (videoId: string) => {
    const quizStatus = quizCompletions.find(q => q.video_id === videoId);
    return quizStatus?.completed || false;
  };

  const isVideoFullyCompleted = (videoId: string) => {
    return isVideoCompleted(videoId) && isQuizCompleted(videoId);
  };

  const isModuleCompleted = (module: Module) => {
    const moduleCompletion = moduleCompletions.find(mc => mc.module_id === module.id);
    return !!moduleCompletion?.completed_at;
  };

  const isModuleUnlocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return true;
    
    const previousModule = modules[moduleIndex - 1];
    return previousModule ? isModuleCompleted(previousModule) : false;
  };

  const isVideoUnlocked = (moduleIndex: number, videoIndex: number) => {
    if (!isModuleUnlocked(moduleIndex)) return false;
    if (videoIndex === 0) return true;
    
    const module = modules[moduleIndex];
    const previousVideo = module.videos[videoIndex - 1];
    return previousVideo ? isVideoFullyCompleted(previousVideo.id) : false;
  };

  const getOverallProgress = () => {
    const totalVideos = modules.reduce((sum, module) => sum + module.videos.length, 0);
    const completedVideos = modules.reduce((sum, module) => 
      sum + module.videos.filter(video => isVideoFullyCompleted(video.id)).length, 0
    );
    
    return totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
  };

  const getModuleProgress = (module: Module) => {
    const completedVideos = module.videos.filter(video => isVideoFullyCompleted(video.id)).length;
    return module.videos.length > 0 ? Math.round((completedVideos / module.videos.length) * 100) : 0;
  };

  const completedModulesCount = modules.filter(module => isModuleCompleted(module)).length;
  const totalVideos = modules.reduce((sum, module) => sum + module.videos.length, 0);
  const completedVideos = modules.reduce((sum, module) => 
    sum + module.videos.filter(video => isVideoFullyCompleted(video.id)).length, 0
  );

  return {
    isVideoCompleted,
    isQuizCompleted,
    isVideoFullyCompleted,
    isModuleCompleted,
    isModuleUnlocked,
    isVideoUnlocked,
    getOverallProgress,
    getModuleProgress,
    completedModulesCount,
    totalVideos,
    completedVideos
  };
};
