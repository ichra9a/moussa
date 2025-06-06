
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Award } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';

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
  return (
    <div className="lg:col-span-3 space-y-6">
      {modules.map((module, moduleIndex) => (
        <Card key={module.id} className={`${!isModuleUnlocked(moduleIndex) ? 'opacity-60' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="arabic-heading flex items-center gap-3">
                {!isModuleUnlocked(moduleIndex) && <Lock size={20} className="text-slate-400" />}
                {isModuleCompleted(module) && <Award size={20} className="text-yellow-500" />}
                <span>المودول {moduleIndex + 1}: {module.title}</span>
              </CardTitle>
              <Badge variant={isModuleCompleted(module) ? 'default' : 'secondary'}>
                {module.videos.filter(video => isVideoCompleted(video.id)).length}/{module.videos.length} فيديو
              </Badge>
            </div>
            {module.description && (
              <p className="text-slate-600 arabic-text">{module.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {module.videos.map((video, videoIndex) => (
              <VideoPlayer
                key={video.id}
                video={video}
                onVideoComplete={onVideoComplete}
                isLocked={!isVideoUnlocked(moduleIndex, videoIndex)}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ModuleSection;
