
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Video, Plus, Search, Edit, Trash2, Eye, Clock } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  youtube_id: string;
  thumbnail?: string;
  duration_seconds: number;
  views: number;
  created_at: string;
  course_id?: string;
  course_title?: string;
}

interface CoachVideoManagementProps {
  onAddVideo: () => void;
  onEditVideo: (video: VideoData) => void;
}

const CoachVideoManagement = ({ onAddVideo, onEditVideo }: CoachVideoManagementProps) => {
  const { coach } = useAuth();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (coach) {
      fetchVideos();
    }
  }, [coach]);

  const fetchVideos = async () => {
    if (!coach) return;

    try {
      setLoading(true);

      // Get coach's courses first
      const { data: coachCourses } = await supabase
        .from('coach_course_assignments')
        .select('course_id')
        .eq('coach_id', coach.id)
        .eq('is_active', true);

      const courseIds = coachCourses?.map(cc => cc.course_id) || [];

      if (courseIds.length === 0) {
        setVideos([]);
        return;
      }

      // Get videos for coach's courses
      const { data: videosData } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          youtube_url,
          youtube_id,
          thumbnail,
          duration_seconds,
          views,
          created_at,
          course_id,
          courses (title)
        `)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });

      if (videosData) {
        const videosWithCourseTitle = videosData.map(video => ({
          ...video,
          course_title: (video.courses as any)?.title || 'بدون دورة'
        }));

        setVideos(videosWithCourseTitle);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الفيديوهات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الفيديو",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold arabic-heading">إدارة الفيديوهات</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold arabic-heading">إدارة الفيديوهات</h2>
        <Button onClick={onAddVideo} className="arabic-text">
          <Plus className="h-4 w-4 mr-2" />
          إضافة فيديو جديد
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في الفيديوهات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 arabic-text"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">إجمالي الفيديوهات</p>
                <p className="text-2xl font-bold">{videos.length}</p>
              </div>
              <Video className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">إجمالي المشاهدات</p>
                <p className="text-2xl font-bold">
                  {videos.reduce((sum, video) => sum + (video.views || 0), 0)}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">إجمالي المدة</p>
                <p className="text-2xl font-bold">
                  {Math.floor(videos.reduce((sum, video) => sum + (video.duration_seconds || 0), 0) / 60)} دقيقة
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="arabic-heading text-lg">{video.title}</CardTitle>
                <Badge variant="outline" className="arabic-text">
                  {video.course_title}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {video.thumbnail && (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              
              {video.description && (
                <p className="text-sm text-gray-600 arabic-text line-clamp-2">
                  {video.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 arabic-text">المدة:</span>
                  <p className="font-semibold">{formatDuration(video.duration_seconds)}</p>
                </div>
                <div>
                  <span className="text-gray-500 arabic-text">المشاهدات:</span>
                  <p className="font-semibold">{video.views}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditVideo(video)}
                  className="flex-1 arabic-text"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteVideo(video.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVideos.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 arabic-heading mb-2">
              لا توجد فيديوهات
            </h3>
            <p className="text-gray-500 arabic-text mb-4">
              {searchTerm ? 'لم يتم العثور على فيديوهات تطابق البحث' : 'لم يتم إضافة أي فيديوهات بعد'}
            </p>
            {!searchTerm && (
              <Button onClick={onAddVideo} className="arabic-text">
                <Plus className="h-4 w-4 mr-2" />
                إضافة فيديو جديد
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachVideoManagement;
