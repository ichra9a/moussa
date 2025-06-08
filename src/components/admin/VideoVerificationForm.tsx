
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface VerificationQuestion {
  question_text: string;
  correct_answer: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface VideoVerificationFormProps {
  questions: VerificationQuestion[];
  onQuestionsChange: (questions: VerificationQuestion[]) => void;
}

const VideoVerificationForm = ({ questions, onQuestionsChange }: VideoVerificationFormProps) => {
  const addQuestion = () => {
    const newQuestion: VerificationQuestion = {
      question_text: '',
      correct_answer: 'A',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: ''
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof VerificationQuestion, value: string) => {
    const updatedQuestions = questions.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    );
    onQuestionsChange(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    onQuestionsChange(updatedQuestions);
  };

  const validateQuestion = (question: VerificationQuestion) => {
    return question.question_text.trim() !== '' &&
           question.option_a.trim() !== '' &&
           question.option_b.trim() !== '' &&
           question.option_c.trim() !== '' &&
           question.option_d.trim() !== '';
  };

  const allQuestionsValid = questions.every(validateQuestion);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium arabic-text">أسئلة التحقق من مشاهدة الفيديو</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuestion}
          className="arabic-text"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة سؤال
        </Button>
      </div>

      {questions.map((question, index) => (
        <Card key={index} className="border-2">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm arabic-text">السؤال {index + 1}</CardTitle>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeQuestion(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 arabic-text">نص السؤال *</label>
              <Textarea
                value={question.question_text}
                onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                placeholder="أدخل نص السؤال"
                className="arabic-text"
                dir="rtl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 arabic-text">الخيار أ *</label>
                <Input
                  value={question.option_a}
                  onChange={(e) => updateQuestion(index, 'option_a', e.target.value)}
                  placeholder="الخيار الأول"
                  className="arabic-text"
                  dir="rtl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 arabic-text">الخيار ب *</label>
                <Input
                  value={question.option_b}
                  onChange={(e) => updateQuestion(index, 'option_b', e.target.value)}
                  placeholder="الخيار الثاني"
                  className="arabic-text"
                  dir="rtl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 arabic-text">الخيار ج *</label>
                <Input
                  value={question.option_c}
                  onChange={(e) => updateQuestion(index, 'option_c', e.target.value)}
                  placeholder="الخيار الثالث"
                  className="arabic-text"
                  dir="rtl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 arabic-text">الخيار د *</label>
                <Input
                  value={question.option_d}
                  onChange={(e) => updateQuestion(index, 'option_d', e.target.value)}
                  placeholder="الخيار الرابع"
                  className="arabic-text"
                  dir="rtl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 arabic-text">الإجابة الصحيحة *</label>
              <select
                value={question.correct_answer}
                onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                className="w-full p-2 border rounded-md arabic-text"
                dir="rtl"
                required
              >
                <option value="A">أ</option>
                <option value="B">ب</option>
                <option value="C">ج</option>
                <option value="D">د</option>
              </select>
            </div>

            {!validateQuestion(question) && (
              <div className="text-red-500 text-sm arabic-text">
                يرجى ملء جميع الحقول المطلوبة
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {questions.length === 0 && (
        <div className="text-center py-8 text-gray-500 arabic-text">
          لا توجد أسئلة تحقق. اضغط "إضافة سؤال" لإضافة السؤال الأول.
        </div>
      )}

      {questions.length > 0 && !allQuestionsValid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-700 arabic-text text-sm">
            تأكد من ملء جميع الحقول المطلوبة لكل سؤال قبل حفظ الفيديو
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoVerificationForm;
