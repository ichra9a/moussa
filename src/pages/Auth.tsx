
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const [pinCode, setPinCode] = useState('');
  const [coachPinCode, setCoachPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { student, coach } = useAuth();

  // If already authenticated, redirect to dashboard
  if (student) {
    navigate('/dashboard');
    return null;
  }

  if (coach) {
    navigate('/coach-dashboard');
    return null;
  }

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pinCode.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز PIN",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('pin_code', pinCode.trim())
        .single();

      if (error || !studentData) {
        toast({
          title: "خطأ في المصادقة",
          description: "رمز PIN غير صحيح",
          variant: "destructive"
        });
        return;
      }

      // Store student data in localStorage
      localStorage.setItem('student', JSON.stringify(studentData));
      
      toast({
        title: "مرحباً " + studentData.full_name,
        description: "تم تسجيل الدخول بنجاح",
      });

      // Navigate immediately without page refresh
      navigate('/dashboard');
      
      // Trigger a custom event to update auth context
      window.dispatchEvent(new CustomEvent('student-auth-changed'));
      
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCoachAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coachPinCode.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز PIN",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: coachData, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('pin_code', coachPinCode.trim())
        .single();

      if (error || !coachData) {
        toast({
          title: "خطأ في المصادقة",
          description: "رمز PIN غير صحيح",
          variant: "destructive"
        });
        return;
      }

      // Store coach data in localStorage
      localStorage.setItem('coach', JSON.stringify(coachData));
      
      toast({
        title: "مرحباً " + coachData.full_name,
        description: "تم تسجيل الدخول بنجاح",
      });

      // Navigate immediately without page refresh
      navigate('/coach-dashboard');
      
      // Trigger a custom event to update auth context
      window.dispatchEvent(new CustomEvent('coach-auth-changed'));
      
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900 arabic-heading">
            تسجيل الدخول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" className="arabic-text">طالب</TabsTrigger>
              <TabsTrigger value="coach" className="arabic-text">مدرب</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              <form onSubmit={handleStudentAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-pin" className="arabic-text">رمز PIN الخاص بك</Label>
                  <Input
                    id="student-pin"
                    type="text"
                    placeholder="أدخل رمز PIN (6 أرقام)"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-wider arabic-text"
                    dir="ltr"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full arabic-text"
                  disabled={loading}
                >
                  {loading ? 'جاري تسجيل الدخول...' : 'دخول كطالب'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="coach">
              <form onSubmit={handleCoachAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coach-pin" className="arabic-text">رمز PIN الخاص بالمدرب</Label>
                  <Input
                    id="coach-pin"
                    type="text"
                    placeholder="أدخل رمز PIN (6 أرقام)"
                    value={coachPinCode}
                    onChange={(e) => setCoachPinCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-wider arabic-text"
                    dir="ltr"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full arabic-text"
                  disabled={loading}
                >
                  {loading ? 'جاري تسجيل الدخول...' : 'دخول كمدرب'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
