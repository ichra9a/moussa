
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentFormProps {
  onStudentCreated: () => void;
  onCancel: () => void;
}

const StudentForm = ({ onStudentCreated, onCancel }: StudentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string>('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const { toast } = useToast();

  const handleGeneratePin = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_unique_pin');
      
      if (error) throw error;
      
      setGeneratedPin(data);
      toast({
        title: "تم إنشاء PIN",
        description: `تم إنشاء رمز PIN: ${data}`,
      });
    } catch (error) {
      console.error('Error generating PIN:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء رمز PIN",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.email.trim() || !generatedPin) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة وإنشاء رمز PIN",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          pin_code: generatedPin
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "خطأ",
            description: "البريد الإلكتروني مستخدم بالفعل أو رمز PIN موجود",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "تم بنجاح",
        description: `تم إنشاء حساب الطالب بنجاح. رمز PIN: ${generatedPin}`
      });

      setFormData({ full_name: '', email: '', phone: '' });
      setGeneratedPin('');
      onStudentCreated();
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء حساب الطالب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 arabic-heading">
          <Users className="h-5 w-5" />
          إنشاء حساب طالب جديد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="arabic-text">الاسم الكامل</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="أدخل الاسم الكامل"
                className="arabic-text"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="arabic-text">البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="أدخل البريد الإلكتروني"
                className="arabic-text"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="arabic-text">رقم الهاتف (اختياري)</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="أدخل رقم الهاتف"
              className="arabic-text"
            />
          </div>

          <div className="space-y-2">
            <Label className="arabic-text">رمز PIN (إنشاء تلقائي)</Label>
            <div className="flex gap-2">
              <Input
                value={generatedPin}
                readOnly
                className="arabic-text font-mono"
                placeholder="سيتم إنشاء رمز تلقائياً"
              />
              <Button 
                type="button"
                onClick={handleGeneratePin}
                className="arabic-text"
              >
                إنشاء رمز
              </Button>
            </div>
          </div>

          {generatedPin && (
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <AlertDescription className="arabic-text text-blue-700 font-medium">
                تم إنشاء رمز PIN: {generatedPin}. يرجى حفظ هذا الرمز لتسليمه للطالب.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mt-6">
            <Button type="submit" disabled={loading} className="arabic-text">
              <Save className="ml-2 h-4 w-4" />
              {loading ? 'جاري الإنشاء...' : 'إنشاء حساب الطالب'}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={onCancel}
              className="arabic-text"
            >
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
