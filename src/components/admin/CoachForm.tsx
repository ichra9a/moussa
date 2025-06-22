
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Save, X } from 'lucide-react';

interface Coach {
  id: string;
  full_name: string;
  email: string;
  pin_code: string;
}

interface CoachFormProps {
  coach?: Coach | null;
  onCoachCreated: () => void;
  onCancel: () => void;
}

const CoachForm = ({ coach, onCoachCreated, onCancel }: CoachFormProps) => {
  const [formData, setFormData] = useState({
    full_name: coach?.full_name || '',
    email: coach?.email || ''
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (coach) {
        // Update existing coach
        const { error } = await supabase
          .from('coaches')
          .update({
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', coach.id);

        if (error) throw error;

        toast({
          title: "تم بنجاح",
          description: "تم تحديث بيانات المدرب بنجاح"
        });
      } else {
        // Create new coach with auto-generated PIN
        const pinCode = await generateUniquePinCode();
        
        const { error } = await supabase
          .from('coaches')
          .insert({
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            pin_code: pinCode
          });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        toast({
          title: "تم بنجاح",
          description: `تم إنشاء المدرب بنجاح. رمز المدرب: ${pinCode}`
        });
      }

      onCoachCreated();
    } catch (error: any) {
      console.error('Error saving coach:', error);
      let errorMessage = "حدث خطأ أثناء حفظ بيانات المدرب";
      
      if (error?.code === '23505') {
        errorMessage = "البريد الإلكتروني مستخدم بالفعل";
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateUniquePinCode = async (): Promise<string> => {
    let pinCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      attempts++;
      pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      try {
        // Check if PIN exists in both coaches and students tables
        const [coachCheck, studentCheck] = await Promise.all([
          supabase
            .from('coaches')
            .select('pin_code')
            .eq('pin_code', pinCode)
            .maybeSingle(),
          supabase
            .from('students')
            .select('pin_code')
            .eq('pin_code', pinCode)
            .maybeSingle()
        ]);

        isUnique = !coachCheck.data && !studentCheck.data;
      } catch (error) {
        console.error('Error checking PIN uniqueness:', error);
        if (attempts >= maxAttempts) {
          throw new Error('فشل في توليد رمز فريد للمدرب');
        }
      }
    } while (!isUnique && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('فشل في توليد رمز فريد للمدرب بعد عدة محاولات');
    }

    return pinCode;
  };

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-heading">
            <User className="h-5 w-5" />
            {coach ? 'تعديل بيانات المدرب' : 'إضافة مدرب جديد'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name" className="arabic-text">الاسم الكامل</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="أدخل الاسم الكامل للمدرب"
                required
                className="arabic-text"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="arabic-text">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="أدخل البريد الإلكتروني للمدرب"
                required
                className="arabic-text"
              />
            </div>

            {coach && (
              <div>
                <Label htmlFor="pin_code" className="arabic-text">رمز المدرب</Label>
                <Input
                  id="pin_code"
                  value={coach.pin_code}
                  disabled
                  className="arabic-text bg-gray-100"
                />
                <p className="text-sm text-gray-600 mt-1 arabic-text">
                  لا يمكن تعديل رمز المدرب بعد إنشائه
                </p>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="arabic-text">
                <Save className="ml-2 h-4 w-4" />
                {loading ? 'جاري الحفظ...' : (coach ? 'حفظ التغييرات' : 'إضافة المدرب')}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="arabic-text">
                <X className="ml-2 h-4 w-4" />
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachForm;
