
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useModuleData } from '@/hooks/useModuleData';
import ModuleForm from './ModuleForm';
import ModuleVideoManager from './ModuleVideoManager';

interface Course {
  id: string;
  title: string;
}

interface ModuleManagementProps {
  courses: Course[];
}

const ModuleManagement = ({ courses: propCourses }: ModuleManagementProps) => {
  const { modules, courses, loading, fetchModules, toast } = useModuleData(propCourses);
  const [editingModule, setEditingModule] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return;

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الوحدة بنجاح"
      });

      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الوحدة",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold arabic-heading">إدارة الوحدات</h2>
        <ModuleForm 
          courses={courses}
          editingModule={editingModule}
          onModuleSaved={() => {
            fetchModules();
            setEditingModule(null);
          }}
        />
      </div>

      <div className="grid gap-6">
        {modules
          .sort((a, b) => a.order_index - b.order_index)
          .map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="arabic-heading">{module.title}</CardTitle>
                  <p className="text-sm text-gray-600 arabic-text mt-1">
                    من دورة: {module.courses.title}
                  </p>
                  {module.description && (
                    <p className="text-sm text-gray-600 arabic-text mt-2">{module.description}</p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    الترتيب: {module.order_index}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingModule(module)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(module.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ModuleVideoManager
                moduleId={module.id}
                moduleVideos={module.module_videos || []}
                onVideosUpdated={fetchModules}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModuleManagement;
