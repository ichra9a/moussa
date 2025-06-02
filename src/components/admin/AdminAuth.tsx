
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface AdminAuthProps {
  onAuthSuccess: () => void;
}

const AdminAuth = ({ onAuthSuccess }: AdminAuthProps) => {
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CORRECT_PIN = '1994';

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simple PIN validation
      if (pinCode !== CORRECT_PIN) {
        throw new Error('رمز PIN غير صحيح - يرجى المحاولة مرة أخرى');
      }

      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      onAuthSuccess();
    } catch (error: any) {
      setError(error.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 font-cairo mobile-app" dir="rtl">
      <Card className="w-full max-w-md mobile-card shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold arabic-heading text-slate-800 mb-2">
            لوحة التحكم الإدارية
          </CardTitle>
          <p className="text-slate-600 arabic-text text-lg">
            أدخل رمز PIN للوصول
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <form onSubmit={handlePinSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="arabic-text text-red-700 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              <label className="block text-center text-slate-700 arabic-text text-lg font-semibold">
                رمز PIN
              </label>
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={4} 
                  value={pinCode} 
                  onChange={setPinCode}
                  className="gap-4"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-16 h-16 text-2xl font-bold border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl" />
                    <InputOTPSlot index={1} className="w-16 h-16 text-2xl font-bold border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl" />
                    <InputOTPSlot index={2} className="w-16 h-16 text-2xl font-bold border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl" />
                    <InputOTPSlot index={3} className="w-16 h-16 text-2xl font-bold border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full arabic-text mobile-button h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 rounded-xl shadow-lg transition-all duration-200" 
              disabled={loading || pinCode.length !== 4}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                'دخول لوحة التحكم'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
