
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Award, Play, CheckCircle } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import ModuleCompletionCard from '@/components/video/ModuleCompletionCard';
import VideoCompletionButton from '@/components/video/VideoCompletionButton';
import { useModuleCompletion } from '@/hooks/useModuleCompletion';
import { useVideoCompletion } from '@/hooks/useVideoCompletion';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  duration_seconds: number;
  order_index: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  videos: Video[];
}

interface ModuleSectionProps {
  modules: Module[];
  isModuleCompleted: (module: Module) => boolean;
  isModuleUnlocked: (moduleIndex: number) => boolean;
  isVideoUnlocked: (moduleIndex: number, videoIndex: number) => boolean;
  isVideoCompleted: (videoId: string) => boolean;
  onVideoComplete: (videoId: string) => void;
}

const ModuleSection = ({ 
  modules, 
  isModuleCompleted, 
  isModuleUnlocked, 
  isVideoUnlocked, 
  isVideoCompleted,
  onVideoComplete 
}: ModuleSectionProps) => {
  const { student } = useAuth();
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  const VideoItem = ({ video, moduleIndex, videoIndex, moduleId }: { 
    video: Video; 
    moduleIndex: number; 
    videoIndex: number;
    moduleId: string;
  }) => {
    const isUnlocked = isVideoUnlocked(moduleIndex, videoIndex);
    const isCompleted = isVideoCompleted(video.id);
    
    const {
      watchTime,
      completionPercentage,
      isCompleted: isVideoProgressCompleted
    } = useVideoProgress(video.id);

    const watchedSufficientTime = completionPercentage >= 70;
    const isVideoFullyCompleted = isCompleted;

    const {
      handleMarkAsComplete
    } = useVideoCompletion(
      student,
      video,
      watchedSufficientTime,
      watchTime,
      completionPercentage,
      video.duration_seconds || 0,
      onVideoComplete
    );

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isUnlocked && <Lock size={16} className="text-slate-400" />}
            {isVideoFullyCompleted && <CheckCircle size={16} className="text-green-500" />}
            <h4 className="font-medium arabic-text">{video.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {video.duration_seconds && (
              <span className="text-sm text-gray-500">
                {formatTime(video.duration_seconds)}
              </span>
            )}
            <button
              onClick={() => setExpandedVideo(expandedVideo === video.id ? null : video.id)}
              disabled={!isUnlocked}
              className={`p-2 rounded-lg transition-colors ${
                !isUnlocked 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              <Play size={16} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {completionPercentage > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>التقدم</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Video Completion Button - Show even when video is closed */}
        <VideoCompletionButton
          watchedSufficientTime={watchedSufficientTime}
          isCompleted={isVideoFullyCompleted}
          onMarkAsComplete={handleMarkAsComplete}
        />

        {/* Expanded Video Player */}
        {expandedVideo === video.id && isUnlocked && (
          <div className="mt-4">
            <VideoPlayer
              video={video}
              onVideoComplete={onVideoComplete}
              isLocked={false}
              moduleId={moduleId}
              isLastVideoInModule={videoIndex === modules.find(m => m.id === moduleId)?.videos.length! - 1}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lg:col-span-3 space-y-6">
      {modules.map((module, moduleIndex) => {
        const completedVideos = module.videos.filter(video => isVideoCompleted(video.id)).length;
        const canCompleteModule = completedVideos === module.videos.length && completedVideos > 0;
        
        const { handleModuleComplete } = useModuleCompletion(student, module.id);

        return (
          <Card key={module.id} className={`${!isModuleUnlocked(moduleIndex) ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="arabic-heading flex items-center gap-3">
                  {!isModuleUnlocked(moduleIndex) && <Lock size={20} className="text-slate-400" />}
                  {isModuleCompleted(module) && <Award size={20} className="text-yellow-500" />}
                  <span>المودول {moduleIndex + 1}: {module.title}</span>
                </CardTitle>
                <Badge variant={isModuleCompleted(module) ? 'default' : 'secondary'}>
                  {completedVideos}/{module.videos.length} فيديو
                </Badge>
              </div>
              {module.description && (
                <p className="text-slate-600 arabic-text">{module.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {module.videos.map((video, videoIndex) => (
                <VideoItem
                  key={video.id}
                  video={video}
                  moduleIndex={moduleIndex}
                  videoIndex={videoIndex}
                  moduleId={module.id}
                />
              ))}
              
              {isModuleUnlocked(moduleIndex) && (
                <ModuleCompletionCard
                  moduleTitle={module.title}
                  totalVideos={module.videos.length}
                  completedVideos={completedVideos}
                  isModuleCompleted={isModuleCompleted(module)}
                  canCompleteModule={canCompleteModule && !isModuleCompleted(module)}
                  onCompleteModule={handleModuleComplete}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ModuleSection;
