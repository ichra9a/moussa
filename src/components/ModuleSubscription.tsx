
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: string;
  title: string;
  description: string;
  course_id: string;
  order_index: number;
  is_active: boolean;
  courses: {
    title: string;
    thumbnail: string;
  };
}

interface ModuleSubscriptionProps {
  module: Module;
  subscription?: {
    id: string;
    progress: number;
    completed_at: string | null;
  };
  onSubscriptionUpdate: () => void;
}

const ModuleSubscription = ({ module, subscription, onSubscriptionUpdate }: ModuleSubscriptionProps) => {
  const { student } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!student) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('module_subscriptions')
        .insert({
          student_id: student.id,
          module_id: module.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "تنبيه",
            description: "أنت مشترك بالفعل في هذا المودول",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "نجح الاشتراك",
          description: "تم اشتراكك في المودول بنجاح",
        });
        onSubscriptionUpdate();
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الاشتراك",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (newProgress: number) => {
    if (!subscription || !student) return;

    try {
      const { error } = await supabase
        .from('module_subscriptions')
        .update({
          progress: newProgress,
          completed_at: newProgress >= 100 ? new Date().toISOString() : null
        })
        .eq('id', subscription.id);

      if (!error) {
        onSubscriptionUpdate();
        if (newProgress >= 100) {
          toast({
            title: "تهانينا!",
            description: "لقد أكملت هذا المودول بنجاح",
          });
        }
      }
    } catch (error) {
      console.error('Progress update error:', error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="relative">
          <img 
            src={module.courses.thumbnail || '/placeholder.svg'} 
            alt={module.title}
            className="w-full h-32 object-cover rounded-lg mb-4"
          />
          {subscription?.completed_at && (
            <Badge className="absolute top-2 right-2 bg-green-500">
              <CheckCircle size={12} className="ml-1" />
              مكتمل
            </Badge>
          )}
          {subscription && !subscription.completed_at && (
            <Badge className="absolute top-2 right-2 bg-blue-500">
              <Clock size={12} className="ml-1" />
              قيد التقدم
            </Badge>
          )}
        </div>
        <CardTitle className="arabic-heading text-lg">
          {module.title}
        </CardTitle>
        <p className="text-sm text-slate-600 arabic-text">
          من دورة: {module.courses.title}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 arabic-text text-sm mb-4 line-clamp-2">
          {module.description}
        </p>
        
        {subscription ? (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="arabic-text">التقدم</span>
                <span>{subscription.progress || 0}%</span>
              </div>
              <Progress value={subscription.progress || 0} className="h-2" />
            </div>
            
            {!subscription.completed_at && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateProgress(Math.min((subscription.progress || 0) + 25, 100))}
                  className="arabic-text"
                >
                  تقدم +25%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateProgress(100)}
                  className="arabic-text"
                >
                  إكمال المودول
                </Button>
              </div>
            )}
            
            <Button 
              className="w-full arabic-text"
              variant={subscription.completed_at ? "outline" : "default"}
            >
              {subscription.completed_at ? 'مراجعة المودول' : 'متابعة التعلم'}
              <Play size={16} className="mr-2" />
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full arabic-text"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? 'جاري الاشتراك...' : 'اشترك في المودول'}
            <BookOpen size={16} className="mr-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleSubscription;
