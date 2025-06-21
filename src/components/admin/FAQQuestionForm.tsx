
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FAQQuestion {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  order_index: number;
  is_active: boolean;
}

interface FAQCategory {
  id: string;
  name: string;
}

interface FAQQuestionFormProps {
  question?: FAQQuestion | null;
  categories: FAQCategory[];
  onSuccess: () => void;
  onCancel: () => void;
}

const FAQQuestionForm = ({ question, categories, onSuccess, onCancel }: FAQQuestionFormProps) => {
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    answer: '',
    order_index: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (question) {
      setFormData({
        category_id: question.category_id,
        question: question.question,
        answer: question.answer,
        order_index: question.order_index,
        is_active: question.is_active,
      });
    }
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (question) {
        // Update existing question
        const { error } = await supabase
          .from('faq_questions')
          .update({
            category_id: formData.category_id,
            question: formData.question,
            answer: formData.answer,
            order_index: formData.order_index,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', question.id);

        if (error) throw error;
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث السؤال بنجاح",
        });
      } else {
        // Create new question
        const { error } = await supabase
          .from('faq_questions')
          .insert([{
            category_id: formData.category_id,
            question: formData.question,
            answer: formData.answer,
            order_index: formData.order_index,
            is_active: formData.is_active,
          }]);

        if (error) throw error;
        
        toast({
          title: "تم الإنشاء",
          description: "تم إنشاء السؤال بنجاح",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ السؤال",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="arabic-heading">
            {question ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category_id" className="arabic-text">التصنيف</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
              >
                <SelectTrigger className="arabic-text">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="arabic-text">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question" className="arabic-text">السؤال</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="أدخل السؤال"
                required
                className="arabic-text"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="answer" className="arabic-text">الإجابة</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="أدخل الإجابة"
                required
                className="arabic-text"
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="order_index" className="arabic-text">ترتيب العرض</Label>
              <Input
                id="order_index"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="arabic-text"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="arabic-text">نشط</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 arabic-text">
                {loading ? 'جاري الحفظ...' : (question ? 'تحديث' : 'إنشاء')}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 arabic-text">
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQQuestionForm;
