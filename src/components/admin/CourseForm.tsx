
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, BookOpen } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_active: boolean;
}

interface CourseFormProps {
  course?: Course | null;
  onSubmit: (courseData: { title: string; description: string; thumbnail: string }) => void;
  onCancel: () => void;
  loading: boolean;
}

const CourseForm = ({ course, onSubmit, onCancel, loading }: CourseFormProps) => {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    thumbnail: course?.thumbnail || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 arabic-heading">
          <BookOpen className="h-5 w-5" />
          {course ? 'تعديل الدورة' : 'إنشاء دورة جديدة'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="arabic-text">عنوان الدورة</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="أدخل عنوان الدورة"
              required
              className="arabic-text"
            />
          </div>
          
          <div>
            <Label className="arabic-text">وصف الدورة</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="أدخل وصف الدورة"
              className="arabic-text"
              rows={3}
            />
          </div>
          
          <div>
            <Label className="arabic-text">رابط الصورة المصغرة</Label>
            <Input
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="أدخل رابط الصورة المصغرة (اختياري)"
              className="arabic-text"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="arabic-text">
              <Save className="ml-2 h-4 w-4" />
              {loading ? 'جاري الحفظ...' : (course ? 'حفظ التغييرات' : 'إنشاء الدورة')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="arabic-text">
              <X className="ml-2 h-4 w-4" />
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseForm;
