
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface QuestionSubmissionFormProps {
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

const QuestionSubmissionForm = ({ categories, onClose, onSuccess }: QuestionSubmissionFormProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    categoryId: '',
    questionText: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.categoryId || !formData.questionText) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_question_submissions')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          category_id: formData.categoryId,
          question_text: formData.questionText,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "تم إرسال السؤال بنجاح!",
        description: "سنقوم بالرد عليك عبر البريد الإلكتروني في أقرب وقت ممكن",
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال السؤال. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold arabic-heading">
              اطرح سؤالاً جديداً
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="arabic-text">
                الاسم الكامل *
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="arabic-text"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="arabic-text">
                البريد الإلكتروني *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                className="arabic-text"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="arabic-text">
              تصنيف السؤال *
            </Label>
            <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
              <SelectTrigger className="arabic-text">
                <SelectValue placeholder="اختر التصنيف المناسب لسؤالك" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question" className="arabic-text">
              نص السؤال *
            </Label>
            <Textarea
              id="question"
              value={formData.questionText}
              onChange={(e) => handleInputChange('questionText', e.target.value)}
              placeholder="اكتب سؤالك هنا بوضوح وتفصيل..."
              rows={5}
              className="arabic-text resize-none"
              required
            />
            <p className="text-sm text-gray-500 arabic-text">
              كن واضحاً ومفصلاً في سؤالك للحصول على أفضل إجابة
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 arabic-text">
              <strong>ملاحظة:</strong> سيتم مراجعة سؤالك من قبل فريقنا والرد عليك عبر البريد الإلكتروني في غضون 24-48 ساعة.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 arabic-text flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال السؤال
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="arabic-text"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionSubmissionForm;
