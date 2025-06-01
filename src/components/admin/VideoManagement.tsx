
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Category {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_id: string;
  thumbnail: string | null;
  category_id: string | null;
  views: number | null;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

interface VideoManagementProps {
  videos: Video[];
  onEdit: (video: Video) => void;
  onRefresh: () => void;
}

const VideoManagement = ({ videos, onEdit, onRefresh }: VideoManagementProps) => {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleDelete = async (videoId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;

    setDeleting(videoId);
    setError('');

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      onRefresh();
    } catch (error: any) {
      setError(error.message || 'خطأ في حذف الفيديو');
    } finally {
      setDeleting(null);
    }
  };

  const getThumbnail = (video: Video) => {
    if (video.thumbnail) return video.thumbnail;
    return `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`;
  };

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-500 arabic-text">لا توجد فيديوهات حتى الآن</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="arabic-text">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {videos.map((video) => (
          <Card key={video.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <img
                  src={getThumbnail(video)}
                  alt={video.title}
                  className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg arabic-text">{video.title}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(video.youtube_url, '_blank')}
                        className="arabic-text"
                      >
                        <ExternalLink size={14} className="ml-1" />
                        عرض
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(video)}
                        className="arabic-text"
                      >
                        <Edit size={14} className="ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(video.id)}
                        disabled={deleting === video.id}
                        className="arabic-text"
                      >
                        <Trash2 size={14} className="ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                  
                  {video.description && (
                    <p className="text-slate-600 text-sm arabic-text line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    {video.categories && (
                      <Badge variant="secondary" className="arabic-text">
                        {video.categories.name}
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{video.views || 0} مشاهدة</span>
                    </div>
                    
                    <span className="arabic-text">
                      {new Date(video.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VideoManagement;
