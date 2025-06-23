
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface Course {
  id: string;
  title: string;
}

interface VideoData {
  id?: string;
  title: string;
  description?: string;
  youtube_url: string;
  course_id?: string;
}

interface CoachVideoFormProps {
  video?: VideoData | null;
  coachId: string;
  onVideoSaved: () => void;
  onCancel: () => void;
}

const CoachVideoForm = ({ video, coachId, onVideoSaved, onCancel }: CoachVideoFormProps) => {
  const [formData, setFormData] = useState<VideoData>({
    title: '',
    description: '',
    youtube_url: '',
    course_id: ''
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
    if (video) {
      setFormData({
        title: video.title,
        description: video.description || '',
        youtube_url: video.youtube_url,
        course_id: video.course_id || ''
      });
    }
  }, [video]);

  const fetchCourses = async () => {
    try {
      const { data: coachCourses } = await supabase
        .from('coach_course_assignments')
        .select(`
          course_id,
          courses (id, title)
        `)
        .eq('coach_id', coachId)
        .eq('is_active', true);

      if (coachCourses) {
        const coursesList = coachCourses.map(cc => ({
          id: cc.course_id,
          title: (cc.courses as any)?.title || 'Unknown Course'
        }));
        setCourses(coursesList);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const youtubeId = extractYouTubeId(formData.youtube_url);
      if (!youtubeId) {
        toast({
          title: "خطأ",
          description: "رابط YouTube غير صحيح",
          variant: "destructive"
        });
        return;
      }

      const videoData = {
        title: formData.title,
        description: formData.description,
        youtube_url: formData.youtube_url,
        youtube_id: youtubeId,
        course_id: formData.course_id || null,
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      };

      if (video?.id) {
        // Update existing video
        const { error } = await supabase
          .from('videos')
          .update(videoData)
          .eq('id', video.id);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: "تم تحديث الفيديو بنجاح"
        });
      } else {
        // Create new video
        const { error } = await supabase
          .from('videos')
          .insert([videoData]);

        if (error) throw error;

        toast({
          title: "تم الإنشاء",
          description: "تم إنشاء الفيديو بنجاح"
        });
      }

      onVideoSaved();
    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الفيديو",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="arabic-heading">
              {video ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">
                عنوان الفيديو *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="أدخل عنوان الفيديو"
                required
                className="arabic-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">
                وصف الفيديو
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="أدخل وصف الفيديو"
                rows={3}
                className="arabic-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">
                رابط YouTube *
              </label>
              <Input
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="arabic-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">
                الدورة
              </label>
              <Select 
                value={formData.course_id} 
                onValueChange={(value) => setFormData({ ...formData, course_id: value })}
              >
                <SelectTrigger className="arabic-text">
                  <SelectValue placeholder="اختر الدورة" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 arabic-text">
                {loading ? 'جاري الحفظ...' : (video ? 'تحديث الفيديو' : 'إضافة الفيديو')}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="arabic-text">
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachVideoForm;
