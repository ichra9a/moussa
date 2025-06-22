
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CoachForm from './CoachForm';
import CoachList from './CoachList';

interface Coach {
  id: string;
  full_name: string;
  email: string;
  pin_code: string;
  created_at: string;
  updated_at: string;
}

const CoachManagement = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoaches(data || []);
    } catch (error) {
      console.error('Error fetching coaches:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات المدربين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCoachCreated = () => {
    fetchCoaches();
    setShowForm(false);
    setEditingCoach(null);
  };

  const handleEditCoach = (coach: Coach) => {
    setEditingCoach(coach);
    setShowForm(true);
  };

  const handleDeleteCoach = async (coachId: string) => {
    try {
      const { error } = await supabase
        .from('coaches')
        .delete()
        .eq('id', coachId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف المدرب بنجاح",
      });

      fetchCoaches();
    } catch (error) {
      console.error('Error deleting coach:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المدرب",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCoach(null);
  };

  if (showForm) {
    return (
      <CoachForm
        coach={editingCoach}
        onCoachCreated={handleCoachCreated}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-slate-900 arabic-heading">إدارة المدربين</h2>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="arabic-text flex items-center gap-2"
        >
          <Plus size={16} />
          إضافة مدرب جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة المدربين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CoachList 
            coaches={coaches}
            loading={loading}
            onEdit={handleEditCoach}
            onDelete={handleDeleteCoach}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachManagement;
