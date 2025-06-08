
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
}

interface Course {
  id: string;
  title: string;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_id: string;
  thumbnail: string | null;
  category_id: string | null;
  course_id: string | null;
  order_index: number | null;
  views: number | null;
  created_at: string;
  updated_at: string;
}

interface AdminVideoFormProps {
  video?: Video | null;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
}

const AdminVideoForm = ({ video, categories, onSave, onCancel }: AdminVideoFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
    if (video) {
      setTitle(video.title);
      setDescription(video.description || '');
      setYoutubeUrl(video.youtube_url);
      setCategoryId(video.category_id || '');
      setCourseId(video.course_id || '');
      setOrderIndex(video.order_index || 1);
    }
  }, [video]);

  const fetchCourses = async () => {
    try {
      const { data } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');
      
      if (data) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const youtubeId = extractYouTubeId(youtubeUrl);
      if (!youtubeId) {
        throw new Error('رابط يوتيوب غير صحيح');
      }

      const videoData = {
        title,
        description: description || null,
        youtube_url: youtubeUrl,
        youtube_id: youtubeId,
        category_id: categoryId || null,
        course_id: courseId || null,
        order_index: orderIndex,
        updated_at: new Date().toISOString(),
      };

      if (video) {
        // Update existing video
        const { error } = await supabase
          .from('videos')
          .update(videoData)
          .eq('id', video.id);

        if (error) throw error;
      } else {
        // Create new video
        const { error } = await supabase
          .from('videos')
          .insert([videoData]);

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      setError(error.message || 'خطأ في حفظ الفيديو');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="arabic-heading">
          {video ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="arabic-text">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium arabic-text">عنوان الفيديو</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل عنوان الفيديو"
              required
              className="arabic-text text-right"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium arabic-text">وصف الفيديو</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أدخل وصف الفيديو"
              className="arabic-text text-right"
              dir="rtl"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium arabic-text">رابط يوتيوب</label>
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium arabic-text">الكورس</label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="arabic-text text-right" dir="rtl">
                <SelectValue placeholder="اختر الكورس" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="arabic-text">
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium arabic-text">الفئة</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="arabic-text text-right" dir="rtl">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="arabic-text">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium arabic-text">ترتيب الفيديو</label>
            <Input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
              min="1"
              className="text-left"
              dir="ltr"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="arabic-text"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="arabic-text"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminVideoForm;
