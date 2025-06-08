
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, ExternalLink, Trash2, Plus, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import VideoQuestionEditor from './VideoQuestionEditor';

interface CourseVideo {
  id: string;
  title: string;
  youtube_id: string;
  youtube_url: string;
  order_index: number;
  duration_seconds: number;
  thumbnail: string;
}

interface CourseVideoManagerProps {
  courseId: string;
  courseTitle: string;
  onVideosUpdated: () => void;
}

const CourseVideoManager = ({ courseId, courseTitle, onVideosUpdated }: CourseVideoManagerProps) => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [addingVideo, setAddingVideo] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState<string | null>(null);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    youtubeUrl: '',
    orderIndex: 1
  });

  useEffect(() => {
    fetchCourseVideos();
  }, [courseId]);

  const fetchCourseVideos = async () => {
    try {
      const { data } = await supabase
        .from('videos')
        .select('id, title, youtube_id, youtube_url, order_index, duration_seconds, thumbnail')
        .eq('course_id', courseId)
        .order('order_index');

      if (data) {
        setVideos(data);
      }
    } catch (error) {
      console.error('Error fetching course videos:', error);
    }
  };

  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const getNextAvailableOrderIndex = () => {
    if (!videos || videos.length === 0) return 1;
    const maxOrder = Math.max(...videos.map(v => v.order_index));
    return maxOrder + 1;
  };

  const handleAddVideo = async () => {
    if (!videoFormData.title.trim() || !videoFormData.youtubeUrl.trim()) {
      toast({
        title: "خطأ",
        description: "يجب ملء عنوان الفيديو ورابط اليوتيوب",
        variant: "destructive"
      });
      return;
    }

    const youtubeId = extractYouTubeId(videoFormData.youtubeUrl);
    if (!youtubeId) {
      toast({
        title: "خطأ",
        description: "رابط يوتيوب غير صحيح",
        variant: "destructive"
      });
      return;
    }

    setAddingVideo(true);

    try {
      const orderIndex = videoFormData.orderIndex || getNextAvailableOrderIndex();

      const { error } = await supabase
        .from('videos')
        .insert({
          title: videoFormData.title,
          youtube_url: videoFormData.youtubeUrl,
          youtube_id: youtubeId,
          course_id: courseId,
          order_index: orderIndex,
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة الفيديو للدورة بنجاح"
      });

      setVideoFormData({ title: '', youtubeUrl: '', orderIndex: getNextAvailableOrderIndex() });
      fetchCourseVideos();
      onVideosUpdated();
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الفيديو",
        variant: "destructive"
      });
    } finally {
      setAddingVideo(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الفيديو بنجاح"
      });

      fetchCourseVideos();
      onVideosUpdated();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الفيديو",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="arabic-heading flex items-center gap-2">
          <Video className="h-5 w-5" />
          فيديوهات دورة "{courseTitle}" ({videos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Video Form */}
        <div className="border-b pb-4">
          <h5 className="font-medium arabic-text mb-3">إضافة فيديو جديد</h5>
          <div className="space-y-3">
            <Input
              placeholder="عنوان الفيديو *"
              value={videoFormData.title}
              onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
              className="arabic-text"
              disabled={addingVideo}
            />
            <Input
              placeholder="رابط يوتيوب (https://youtube.com/watch?v=...) *"
              value={videoFormData.youtubeUrl}
              onChange={(e) => setVideoFormData({ ...videoFormData, youtubeUrl: e.target.value })}
              dir="ltr"
              className="text-left"
              disabled={addingVideo}
            />
            <div className="flex gap-3">
              <div className="w-24">
                <Input
                  type="number"
                  placeholder="ترتيب"
                  value={videoFormData.orderIndex}
                  onChange={(e) => setVideoFormData({ ...videoFormData, orderIndex: parseInt(e.target.value) || getNextAvailableOrderIndex() })}
                  min="1"
                  disabled={addingVideo}
                />
              </div>
              <Button
                onClick={handleAddVideo}
                disabled={!videoFormData.title.trim() || !videoFormData.youtubeUrl.trim() || addingVideo}
                className="arabic-text"
              >
                {addingVideo ? 'جاري الإضافة...' : (
                  <>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة فيديو
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Videos List */}
        <div className="space-y-4">
          {videos.length > 0 ? (
            videos
              .sort((a, b) => a.order_index - b.order_index)
              .map((video) => (
                <div key={video.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">{video.order_index}</span>
                      </div>
                      <div>
                        <p className="font-medium arabic-text">{video.title}</p>
                        <p className="text-sm text-gray-500">YouTube ID: {video.youtube_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingQuestions(
                          editingQuestions === video.id ? null : video.id
                        )}
                        className="arabic-text"
                      >
                        <Settings className="h-4 w-4" />
                        {editingQuestions === video.id ? 'إخفاء' : 'أسئلة'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://youtube.com/watch?v=${video.youtube_id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingQuestions === video.id && (
                    <VideoQuestionEditor
                      videoId={video.id}
                      videoTitle={video.title}
                      onQuestionsUpdated={() => fetchCourseVideos()}
                    />
                  )}
                </div>
              ))
          ) : (
            <p className="text-gray-500 arabic-text text-center py-8">لا توجد فيديوهات في هذه الدورة</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseVideoManager;
