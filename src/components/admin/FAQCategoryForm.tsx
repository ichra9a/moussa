
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FAQCategory {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
}

interface FAQCategoryFormProps {
  category?: FAQCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const FAQCategoryForm = ({ category, onSuccess, onCancel }: FAQCategoryFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order_index: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        order_index: category.order_index,
        is_active: category.is_active,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category) {
        // Update existing category
        const { error } = await supabase
          .from('faq_categories')
          .update({
            name: formData.name,
            description: formData.description || null,
            order_index: formData.order_index,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', category.id);

        if (error) throw error;
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث التصنيف بنجاح",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('faq_categories')
          .insert([{
            name: formData.name,
            description: formData.description || null,
            order_index: formData.order_index,
            is_active: formData.is_active,
          }]);

        if (error) throw error;
        
        toast({
          title: "تم الإنشاء",
          description: "تم إنشاء التصنيف بنجاح",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ التصنيف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="arabic-heading">
            {category ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="arabic-text">اسم التصنيف</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم التصنيف"
                required
                className="arabic-text"
              />
            </div>

            <div>
              <Label htmlFor="description" className="arabic-text">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="أدخل وصف التصنيف (اختياري)"
                className="arabic-text"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="order_index" className="arabic-text">ترتيب العرض</Label>
              <Input
                id="order_index"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="arabic-text"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="arabic-text">نشط</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 arabic-text">
                {loading ? 'جاري الحفظ...' : (category ? 'تحديث' : 'إنشاء')}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 arabic-text">
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQCategoryForm;
