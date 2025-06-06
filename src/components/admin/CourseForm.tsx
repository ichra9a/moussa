
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';

interface CourseFormProps {
  onSubmit: (courseData: { title: string; description: string; thumbnail: string }) => void;
  onCancel: () => void;
  loading: boolean;
}

const CourseForm = ({ onSubmit, onCancel, loading }: CourseFormProps) => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    thumbnail: ''
  });

  const handleSubmit = () => {
    onSubmit(courseData);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="arabic-text">عنوان الدورة</Label>
          <Input
            value={courseData.title}
            onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
            placeholder="أدخل عنوان الدورة"
            className="arabic-text"
          />
        </div>
        <div>
          <Label className="arabic-text">رابط الصورة المصغرة</Label>
          <Input
            value={courseData.thumbnail}
            onChange={(e) => setCourseData({ ...courseData, thumbnail: e.target.value })}
            placeholder="رابط الصورة (اختياري)"
            className="arabic-text"
          />
        </div>
      </div>
      <div>
        <Label className="arabic-text">وصف الدورة</Label>
        <Textarea
          value={courseData.description}
          onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
          placeholder="أدخل وصف الدورة"
          className="arabic-text"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={loading} className="arabic-text">
          <Save className="ml-2 h-4 w-4" />
          حفظ الدورة
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="arabic-text"
        >
          <X className="ml-2 h-4 w-4" />
          إلغاء
        </Button>
      </div>
    </div>
  );
};

export default CourseForm;
