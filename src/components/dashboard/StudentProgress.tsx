
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface Subscription {
  id: string;
  student_id: string;
  module_id: string;
  progress: number;
  completed_at: string | null;
  students: {
    full_name: string;
  };
  modules: {
    title: string;
  };
}

interface StudentProgressProps {
  subscriptions: Subscription[];
}

const StudentProgress = ({ subscriptions }: StudentProgressProps) => {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <Users size={64} className="mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-600 arabic-heading mb-2">
          لا يوجد طلاب مسجلين حالياً
        </h3>
        <p className="text-slate-500 arabic-text">
          سيظهر تقدم الطلاب هنا عند تسجيلهم في الدورات
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {subscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="arabic-heading text-lg">
                  {subscription.students.full_name}
                </CardTitle>
                <p className="text-slate-600 arabic-text text-sm">
                  {subscription.modules.title}
                </p>
              </div>
              <Badge variant={subscription.completed_at ? 'default' : 'secondary'}>
                {subscription.completed_at ? 'مكتمل' : 'قيد التقدم'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="arabic-text">التقدم</span>
                <span>{subscription.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${subscription.progress || 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudentProgress;
