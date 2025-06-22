
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Save, X, Upload } from 'lucide-react';

interface Course {
  id?: string;
  title: string;
  description?: string;
  thumbnail?: string;
  is_active: boolean;
}

interface CoachCourseFormProps {
  course?: Course | null;
  coachId: string;
  onCourseSaved: () => void;
  onCancel: () => void;
}

const CoachCourseForm = ({ course, coachId, onCourseSaved, onCancel }: CoachCourseFormProps) => {
  const [formData, setFormData] = useState<Course>({
    title: '',
    description: '',
    thumbnail: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        thumbnail: course.thumbnail || '',
        is_active: course.is_active ?? true
      });
    }
  }, [course]);

  const handleInputChange = (field: keyof Course, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let courseId = course?.id;

      if (course?.id) {
        // Update existing course
        const { error: updateError } = await supabase
          .from('courses')
          .update({
            title: formData.title,
            description: formData.description || null,
            thumbnail: formData.thumbnail || null,
            is_active: formData.is_active
          })
          .eq('id', course.id);

        if (updateError) throw updateError;
      } else {
        // Create new course
        const { data: newCourse, error: insertError } = await supabase
          .from('courses')
          .insert({
            title: formData.title,
            description: formData.description || null,
            thumbnail: formData.thumbnail || null,
            is_active: formData.is_active
          })
          .select()
          .single();

        if (insertError) throw insertError;
        courseId = newCourse.id;

        // Assign course to coach
        const { error: assignmentError } = await supabase
          .from('coach_course_assignments')
          .insert({
            coach_id: coachId,
            course_id: courseId,
            permissions: {
              can_edit: true,
              can_delete: false,
              can_assign_students: true
            }
          });

        if (assignmentError) throw assignmentError;
      }

      toast({
        title: "تم بنجاح",
        description: course?.id ? "تم تحديث الدورة بنجاح" : "تم إنشاء الدورة بنجاح"
      });

      onCourseSaved();
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ بيانات الدورة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="arabic-heading flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {course?.id ? 'تعديل الدورة' : 'إنشاء دورة جديدة'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="arabic-text">عنوان الدورة</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="أدخل عنوان الدورة"
                className="arabic-text"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="arabic-text">وصف الدورة</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="أدخل وصف تفصيلي للدورة"
                className="arabic-text min-h-[100px]"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="thumbnail" className="arabic-text">رابط الصورة المصغرة</Label>
              <div className="space-y-2">
                <Input
                  id="thumbnail"
                  value={formData.thumbnail || ''}
                  onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                  placeholder="أدخل رابط الصورة المصغرة (اختياري)"
                  className="arabic-text"
                />
                {formData.thumbnail && (
                  <div className="mt-2">
                    <img
                      src={formData.thumbnail}
                      alt="معاينة الصورة"
                      className="w-32 h-20 object-cover rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="is_active" className="arabic-text">حالة الدورة</Label>
                <p className="text-sm text-gray-500 arabic-text">
                  تحديد ما إذا كانت الدورة نشطة ومتاحة للطلاب
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
            </div>
          </div>

          {/* Course Statistics (for existing courses) */}
          {course?.id && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold arabic-heading mb-3">إحصائيات الدورة</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                  <p className="text-sm text-gray-600 arabic-text">الوحدات</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">0</p>
                  <p className="text-sm text-gray-600 arabic-text">الفيديوهات</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-gray-600 arabic-text">الطلاب</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 arabic-text"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {course?.id ? 'تحديث الدورة' : 'إنشاء الدورة'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="arabic-text"
            >
              <X className="h-4 w-4 mr-2" />
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CoachCourseForm;
