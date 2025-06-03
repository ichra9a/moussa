
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              phone: phone,
            }
          }
        });
        if (error) throw error;
        setError('تم إرسال رابط التأكيد إلى بريدك الإلكتروني');
      }
    } catch (error: any) {
      setError(error.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
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
            {isLogin ? 'مرحباً بك مرة أخرى' : 'انضم إلينا وابدأ التعلم'}
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <Alert variant={error.includes('تم إرسال') ? 'default' : 'destructive'} className="border-blue-200 bg-blue-50">
                <AlertDescription className="arabic-text text-blue-700 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="arabic-text font-semibold">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12 text-lg border-2 border-slate-300 focus:border-blue-500 rounded-xl"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="arabic-text font-semibold">رقم الهاتف (اختياري)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 text-lg border-2 border-slate-300 focus:border-blue-500 rounded-xl"
                    placeholder="أدخل رقم هاتفك"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="arabic-text font-semibold">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-lg border-2 border-slate-300 focus:border-blue-500 rounded-xl"
                placeholder="أدخل بريدك الإلكتروني"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="arabic-text font-semibold">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-lg border-2 border-slate-300 focus:border-blue-500 rounded-xl pl-12"
                  placeholder="أدخل كلمة المرور"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
