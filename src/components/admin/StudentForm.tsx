
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Save, X } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  pin_code: string;
}

interface StudentFormProps {
  student?: Student | null;
  onStudentCreated: () => void;
  onCancel: () => void;
}

const StudentForm = ({ student, onStudentCreated, onCancel }: StudentFormProps) => {
  const [formData, setFormData] = useState({
    full_name: student?.full_name || '',
    email: student?.email || '',
    phone: student?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الاسم والبريد الإلكتروني",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (student) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null
          })
          .eq('id', student.id);

        if (error) throw error;

        toast({
          title: "تم بنجاح",
          description: "تم تحديث بيانات الطالب بنجاح"
        });
      } else {
        // Create new student
        const pinCode = await generateUniquePinCode();
        
        const { error } = await supabase
          .from('students')
          .insert({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            pin_code: pinCode
          });

        if (error) throw error;

        toast({
          title: "تم بنجاح",
          description: `تم إنشاء الطالب بنجاح. رمز الطالب: ${pinCode}`
        });
      }

      onStudentCreated();
    } catch (error) {
      console.error('Error saving student:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ بيانات الطالب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateUniquePinCode = async (): Promise<string> => {
    let pinCode: string;
    let isUnique = false;

    do {
      pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { data } = await supabase
        .from('students')
        .select('pin_code')
        .eq('pin_code', pinCode)
        .single();
      
      isUnique = !data;
    } while (!isUnique);

    return pinCode;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 arabic-heading">
          <User className="h-5 w-5" />
          {student ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="arabic-text">الاسم الكامل</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="أدخل الاسم الكامل"
              required
              className="arabic-text"
            />
          </div>
          
          <div>
            <Label className="arabic-text">البريد الإلكتروني</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="أدخل البريد الإلكتروني"
              required
              className="arabic-text"
            />
          </div>
          
          <div>
            <Label className="arabic-text">رقم الهاتف (اختياري)</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="أدخل رقم الهاتف"
              className="arabic-text"
            />
          </div>

          {student && (
            <div>
              <Label className="arabic-text">رمز الطالب</Label>
              <Input
                value={student.pin_code}
                disabled
                className="arabic-text bg-gray-100"
              />
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="arabic-text">
              <Save className="ml-2 h-4 w-4" />
              {loading ? 'جاري الحفظ...' : (student ? 'حفظ التغييرات' : 'إضافة الطالب')}
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

export default StudentForm;
