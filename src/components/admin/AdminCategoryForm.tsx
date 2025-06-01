
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminCategoryFormProps {
  category?: Category | null;
  onSave: () => void;
  onCancel: () => void;
}

const AdminCategoryForm = ({ category, onSave, onCancel }: AdminCategoryFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setThumbnail(category.thumbnail || '');
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const categoryData = {
        name,
        description: description || null,
        thumbnail: thumbnail || null,
        updated_at: new Date().toISOString(),
      };

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id);

        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      setError(error.message || 'خطأ في حفظ الفئة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="arabic-heading">
          {category ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
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
            <label className="text-sm font-medium arabic-text">اسم الفئة</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الفئة"
              required
              className="arabic-text text-right"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium arabic-text">وصف الفئة</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أدخل وصف الفئة"
              className="arabic-text text-right"
              dir="rtl"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium arabic-text">رابط الصورة المصغرة</label>
            <Input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://example.com/image.jpg"
              dir="ltr"
              className="text-left"
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

export default AdminCategoryForm;
