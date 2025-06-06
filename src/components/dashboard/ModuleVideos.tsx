
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail: string;
  duration_seconds: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  course_title: string;
  videos: Video[];
  progress: number;
}

interface VideoProgress {
  video_id: string;
  completion_percentage: number;
  completed_at: string | null;
}

const ModuleVideos = () => {
  const { student } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      fetchModulesAndVideos();
      fetchVideoProgress();
    }
  }, [student]);

  const fetchModulesAndVideos = async () => {
    if (!student) return;

    try {
      // First get enrolled modules
      const { data: subscriptions } = await supabase
        .from('module_subscriptions')
        .select(`
          module_id,
          progress,
          modules (
            id,
            title,
            description,
            courses (
              title
            )
          )
        `)
        .eq('student_id', student.id)
        .eq('is_active', true);

      if (subscriptions) {
        // For each module, get its videos
        const modulesWithVideos = await Promise.all(
          subscriptions.map(async (sub: any) => {
            const { data: moduleVideos } = await supabase
              .from('module_videos')
              .select(`
                videos (
                  id,
                  title,
                  description,
                  youtube_url,
                  thumbnail,
                  duration_seconds
                )
              `)
              .eq('module_id', sub.module_id)
              .order('order_index');

            return {
              id: sub.module_id,
              title: sub.modules.title,
              description: sub.modules.description,
              course_title: sub.modules.courses?.title || '',
              videos: moduleVideos?.map((mv: any) => mv.videos).filter(Boolean) || [],
              progress: sub.progress || 0
            };
          })
        );

        setModules(modulesWithVideos);
      }
    } catch (error) {
      console.error('Error fetching modules and videos:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الوحدات والفيديوهات",
        variant: "destructive"
      });
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

      if (data) setVideoProgress(data);
    } catch (error) {
      console.error('Error fetching video progress:', error);
    }
  };

  const getVideoProgress = (videoId: string) => {
    return videoProgress.find(vp => vp.video_id === videoId);
  };

  const handleWatchVideo = (video: Video) => {
    // Open video in new tab - you can modify this to use a modal or embedded player
    window.open(video.youtube_url, '_blank');
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')} ساعة`;
    }
    return `${minutes} دقيقة`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">الوحدات والفيديوهات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-heading">
            <BookOpen className="h-5 w-5" />
            الوحدات والفيديوهات
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 arabic-text">لم يتم تسجيلك في أي وحدة تعليمية بعد</p>
          <p className="text-sm text-gray-400 arabic-text mt-2">تواصل مع الإدارة للحصول على وصول للوحدات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-heading">
            <BookOpen className="h-5 w-5" />
            الوحدات والفيديوهات
          </CardTitle>
        </CardHeader>
      </Card>

      {modules.map((module) => (
        <Card key={module.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="arabic-text">{module.title}</CardTitle>
                <p className="text-sm text-gray-600 arabic-text">{module.course_title}</p>
                {module.description && (
                  <p className="text-sm text-gray-500 arabic-text">{module.description}</p>
                )}
              </div>
              <div className="text-left">
                <Badge variant="secondary" className="arabic-text">
                  {module.progress}% مكتمل
                </Badge>
                <Progress value={module.progress} className="w-24 mt-2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {module.videos.length === 0 ? (
              <p className="text-center text-gray-500 py-4 arabic-text">
                لا توجد فيديوهات متاحة في هذه الوحدة
              </p>
            ) : (
              <div className="space-y-3">
                {module.videos.map((video, index) => {
                  const progress = getVideoProgress(video.id);
                  const isCompleted = progress?.completion_percentage === 100;
                  
                  return (
                    <div key={video.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {video.thumbnail ? (
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-24 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <Play className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-semibold arabic-text">{video.title}</h4>
                              {video.description && (
                                <p className="text-sm text-gray-600 arabic-text line-clamp-2">
                                  {video.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(video.duration_seconds)}
                                </span>
                                {isCompleted && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    مكتمل
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => handleWatchVideo(video)}
                              size="sm"
                              className="arabic-text flex-shrink-0"
                            >
                              <Play className="h-4 w-4 ml-1" />
                              مشاهدة
                            </Button>
                          </div>
                          
                          {progress && progress.completion_percentage > 0 && (
                            <div className="mt-2">
                              <Progress value={progress.completion_percentage} className="h-1" />
                              <p className="text-xs text-gray-500 mt-1">
                                {progress.completion_percentage}% مكتمل
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ModuleVideos;
