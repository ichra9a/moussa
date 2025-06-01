
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Folder } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Category {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryManagementProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onRefresh: () => void;
}

const CategoryManagement = ({ categories, onEdit, onRefresh }: CategoryManagementProps) => {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleDelete = async (categoryId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع الفيديوهات المرتبطة بها.')) return;

    setDeleting(categoryId);
    setError('');

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      onRefresh();
    } catch (error: any) {
      setError(error.message || 'خطأ في حذف الفئة');
    } finally {
      setDeleting(null);
    }
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-500 arabic-text">لا توجد فئات حتى الآن</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {category.thumbnail ? (
                  <img
                    src={category.thumbnail}
                    alt={category.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Folder size={32} className="text-slate-400" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg arabic-text">{category.name}</h3>
                  
                  {category.description && (
                    <p className="text-slate-600 text-sm arabic-text line-clamp-3">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="text-xs text-slate-500 arabic-text">
                    {new Date(category.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(category)}
                    className="arabic-text flex-1"
                  >
                    <Edit size={14} className="ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={deleting === category.id}
                    className="arabic-text flex-1"
                  >
                    <Trash2 size={14} className="ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryManagement;
