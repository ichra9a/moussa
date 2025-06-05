
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPin, setShowPin] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!pinCode) {
        setError('يرجى إدخال رمز PIN');
        return;
      }

      console.log('Attempting login with PIN:', pinCode);

      // Try to find user in students table first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('pin_code', pinCode)
        .maybeSingle();

      console.log('Student lookup result:', { student, studentError });

      if (student) {
        localStorage.setItem('student', JSON.stringify(student));
        console.log('Student logged in successfully:', student);
        navigate('/dashboard');
        return;
      }

      // Try to find user in coaches table
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('*')
        .eq('pin_code', pinCode)
        .maybeSingle();

      console.log('Coach lookup result:', { coach, coachError });

      if (coach) {
        localStorage.setItem('coach', JSON.stringify(coach));
        console.log('Coach logged in successfully:', coach);
        navigate('/coach-dashboard');
        return;
      }

      setError('رمز PIN غير صحيح أو الحساب غير موجود. يرجى التواصل مع الإدارة لإنشاء حساب.');
    } catch (error: any) {
      console.error('Auth error:', error);
      setError('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-cairo" dir="rtl">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold arabic-heading text-slate-800 mb-2">
            تسجيل الدخول
          </CardTitle>
          <p className="text-slate-600 arabic-text text-lg">
            أدخل رمز PIN الخاص بك للدخول
          </p>
          <p className="text-slate-500 arabic-text text-sm mt-2">
            لا تملك حساب؟ يرجى التواصل مع الإدارة لإنشاء حساب جديد
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="arabic-text text-red-700 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="pinCode" className="arabic-text font-semibold">
                رمز PIN
              </Label>
              <div className="relative">
                <Input
                  id="pinCode"
                  type={showPin ? 'text' : 'password'}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="h-12 text-lg border-2 border-slate-300 focus:border-blue-500 rounded-xl pl-12"
                  placeholder="أدخل رمز PIN"
                  maxLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 rounded-xl shadow-lg transition-all duration-200 arabic-text" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
            
            <div className="text-center mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="arabic-text text-blue-800 text-sm font-medium">
                للحصول على حساب جديد، يرجى التواصل مع الإدارة
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
