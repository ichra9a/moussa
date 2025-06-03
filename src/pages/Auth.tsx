
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
  const [isLogin, setIsLogin] = useState(true);
  const [pinCode, setPinCode] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login with PIN
        if (!pinCode) {
          setError('يرجى إدخال رمز PIN');
          return;
        }

        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('pin_code', pinCode)
          .maybeSingle();

        if (error || !data) {
          setError('رمز PIN غير صحيح');
          return;
        }

        // Store student info in localStorage for session management
        localStorage.setItem('student', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        // Register with PIN
        if (!firstName.trim() || !lastName.trim()) {
          setError('يرجى إدخال الاسم الأول والأخير');
          return;
        }

        if (!pinCode || pinCode.length < 4) {
          setError('يجب أن يكون رمز PIN مكون من 4 أرقام على الأقل');
          return;
        }

        if (pinCode !== confirmPin) {
          setError('رمز PIN غير متطابق');
          return;
        }

        // Check if PIN already exists
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('pin_code', pinCode)
          .maybeSingle();

        if (existingStudent) {
          setError('رمز PIN مستخدم بالفعل، يرجى اختيار رمز آخر');
          return;
        }

        // Create new student with manual insert to avoid type issues
        const { data, error } = await supabase
          .rpc('create_student_with_pin', {
            p_first_name: firstName.trim(),
            p_last_name: lastName.trim(),
            p_full_name: `${firstName.trim()} ${lastName.trim()}`,
            p_pin_code: pinCode,
            p_email: `student_${pinCode}@temp.com`
          });

        if (error) {
          // Fallback to direct insert if RPC doesn't exist
          const { data: insertData, error: insertError } = await supabase
            .from('students')
            .insert({
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`,
              pin_code: pinCode,
              email: `student_${pinCode}@temp.com`
            } as any)
            .select()
            .single();

          if (insertError) {
            setError('حدث خطأ أثناء إنشاء الحساب');
            return;
          }

          // Store student info in localStorage
          localStorage.setItem('student', JSON.stringify(insertData));
          navigate('/dashboard');
        } else {
          // If RPC worked, fetch the created student
          const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('pin_code', pinCode)
            .single();

          if (studentData) {
            localStorage.setItem('student', JSON.stringify(studentData));
            navigate('/dashboard');
          }
        }
      }
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
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </CardTitle>
          <p className="text-slate-600 arabic-text text-lg">
            {isLogin ? 'أدخل رمز PIN الخاص بك' : 'أنشئ حسابك الجديد'}
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
            
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="arabic-text font-semibold">الاسم الأول</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-12 text-lg border-2 border-slate-300 focus:border-blue-500 rounded-xl"
                    placeholder="أدخل اسمك الأول"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="arabic-text font-semibold">الاسم الأخير</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-12 text-lg border-2 border-slate-300 focus:border-blue-500 rounded-xl"
                    placeholder="أدخل اسمك الأخير"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="pinCode" className="arabic-text font-semibold">
                {isLogin ? 'رمز PIN' : 'اختر رمز PIN (4 أرقام على الأقل)'}
              </Label>
              <div className="relative">
                <Input
                  id="pinCode"
                  type={showPin ? 'text' : 'password'}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="h-12 text-lg border-2 border-slate-300 focus:border-blue-500 rounded-xl pl-12"
                  placeholder={isLogin ? "أدخل رمز PIN" : "مثال: 1234"}
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

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPin" className="arabic-text font-semibold">تأكيد رمز PIN</Label>
                <div className="relative">
                  <Input
                    id="confirmPin"
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    required
                    className="h-12 text-lg border-2 border-slate-300 focus:border-blue-500 rounded-xl"
                    placeholder="أعد إدخال رمز PIN"
                    maxLength={6}
                  />
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 rounded-xl shadow-lg transition-all duration-200 arabic-text" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  {isLogin ? 'جاري تسجيل الدخول...' : 'جاري إنشاء الحساب...'}
                </>
              ) : (
                isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'
              )}
            </Button>
            
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className="arabic-text text-blue-600 hover:text-blue-800"
              >
                {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخولك'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
