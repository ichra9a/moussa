
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Mail, User, Key } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Coach {
  id: string;
  full_name: string;
  email: string;
  pin_code: string;
  created_at: string;
  updated_at: string;
}

interface CoachListProps {
  coaches: Coach[];
  loading: boolean;
  onEdit: (coach: Coach) => void;
  onDelete: (coachId: string) => void;
}

const CoachList = ({ coaches, loading, onEdit, onDelete }: CoachListProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-slate-600 arabic-text">جاري التحميل...</div>
      </div>
    );
  }

  if (coaches.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-slate-600 arabic-text">لا توجد مدربين مضافين بعد</p>
        <p className="text-sm text-slate-500 arabic-text mt-2">
          يمكنك إضافة مدربين جدد باستخدام الزر أعلاه
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {coaches.map((coach) => (
        <div
          key={coach.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900 arabic-text">
                  {coach.full_name}
                </h3>
                <Badge variant="outline" className="arabic-text">
                  مدرب
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-slate-600 mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="arabic-text break-all">{coach.email}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-slate-400" />
                  <span className="arabic-text font-mono text-blue-600 font-semibold">
                    {coach.pin_code}
                  </span>
                </div>
                
                <div className="arabic-text text-slate-500">
                  تاريخ الإضافة: {formatDate(coach.created_at)}
                </div>
              </div>

              {coach.updated_at !== coach.created_at && (
                <div className="text-xs text-slate-400 arabic-text">
                  آخر تحديث: {formatDate(coach.updated_at)}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(coach)}
                className="arabic-text"
              >
                <Edit className="h-4 w-4" />
                تعديل
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="arabic-text">
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="font-cairo" dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="arabic-heading">
                      هل أنت متأكد من حذف هذا المدرب؟
                    </AlertDialogTitle>
                    <AlertDialogDescription className="arabic-text">
                      سيتم حذف المدرب "<strong>{coach.full_name}</strong>" نهائياً من النظام. 
                      هذا الإجراء لا يمكن التراجع عنه وسيفقد المدرب إمكانية الوصول للنظام.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="arabic-text">إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(coach.id)}
                      className="bg-red-600 hover:bg-red-700 arabic-text"
                    >
                      حذف نهائياً
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CoachList;
