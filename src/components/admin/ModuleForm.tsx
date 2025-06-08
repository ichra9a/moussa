
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  course_id: string;
  is_active: boolean;
  courses: {
    title: string;
  };
  module_videos: Array<{
    id: string;
    order_index: number;
    videos: any;
  }>;
}

interface ModuleFormProps {
  courses: Course[];
  editingModule: Module | null;
  onModuleSaved: () => void;
}

const ModuleForm = ({ courses, editingModule, onModuleSaved }: ModuleFormProps) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    order_index: 1
  });

  const getNextOrderIndex = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      return data && data.length > 0 ? data[0].order_index + 1 : 1;
    } catch (error) {
      console.error('Error getting next order index:', error);
      return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.course_id) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      if (editingModule) {
        const { error } = await supabase
          .from('modules')
          .update({
            title: formData.title,
            description: formData.description,
            course_id: formData.course_id,
            order_index: formData.order_index
          })
          .eq('id', editingModule.id);

        if (error) throw error;
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث الوحدة بنجاح"
        });
      } else {
        const nextOrderIndex = await getNextOrderIndex(formData.course_id);
        
        const { error } = await supabase
          .from('modules')
          .insert({
            title: formData.title,
            description: formData.description,
            course_id: formData.course_id,
            order_index: nextOrderIndex,
            is_active: true
          });

        if (error) throw error;
        
        toast({
          title: "تم الإنشاء",
          description: "تم إنشاء الوحدة بنجاح"
        });
      }

      setFormData({ title: '', description: '', course_id: '', order_index: 1 });
      setIsDialogOpen(false);
      onModuleSaved();
    } catch (error) {
      console.error('Error saving module:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الوحدة",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDialog = (module?: Module) => {
    if (module) {
      setFormData({
        title: module.title,
        description: module.description || '',
        course_id: module.course_id,
        order_index: module.order_index
      });
    } else {
      setFormData({ title: '', description: '', course_id: '', order_index: 1 });
    }
    setIsDialogOpen(true);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          className="arabic-text"
          onClick={() => openDialog()}
        >
          <Plus className="ml-2 h-4 w-4" />
          إضافة وحدة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="arabic-heading">
            {editingModule ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 arabic-text">العنوان *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="arabic-text"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 arabic-text">الوصف</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="arabic-text"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 arabic-text">الدورة *</label>
            <Select 
              value={formData.course_id} 
              onValueChange={(value) => setFormData({ ...formData, course_id: value })}
              required
              disabled={submitting}
            >
              <SelectTrigger>
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
          {editingModule && (
            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">ترتيب الوحدة</label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
                min="1"
                required
                disabled={submitting}
              />
            </div>
          )}
          <Button type="submit" className="w-full arabic-text" disabled={submitting}>
            {submitting ? 'جاري الحفظ...' : (editingModule ? 'تحديث الوحدة' : 'إضافة الوحدة')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleForm;
