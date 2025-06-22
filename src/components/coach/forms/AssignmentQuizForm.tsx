
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2, Save, X } from 'lucide-react';

interface Question {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

interface Assignment {
  id?: string;
  title: string;
  description?: string;
  instructions?: string;
  max_score?: number;
  is_active: boolean;
}

interface AssignmentQuizFormProps {
  assignment?: Assignment | null;
  videoId?: string;
  courseId: string;
  onAssignmentSaved: () => void;
  onCancel: () => void;
}

const AssignmentQuizForm = ({ 
  assignment, 
  videoId, 
  courseId, 
  onAssignmentSaved, 
  onCancel 
}: AssignmentQuizFormProps) => {
  const [formData, setFormData] = useState<Assignment>({
    title: '',
    description: '',
    instructions: '',
    max_score: 100,
    is_active: true
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        instructions: assignment.instructions || '',
        max_score: assignment.max_score || 100,
        is_active: assignment.is_active ?? true
      });
      fetchAssignmentQuestions();
    } else {
      // Add default question for new assignments
      addNewQuestion();
    }
  }, [assignment]);

  const fetchAssignmentQuestions = async () => {
    if (!assignment?.id) return;

    try {
      const { data: questionsData } = await supabase
        .from('assignment_questions')
        .select('*')
        .eq('assignment_id', assignment.id)
        .order('order_index');

      if (questionsData) {
        setQuestions(questionsData.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type as Question['question_type'],
          options: Array.isArray(q.options) ? q.options : [],
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: q.order_index
        })));
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const addNewQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
      order_index: questions.length
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === questionIndex 
        ? { ...q, options: q.options.map((opt, j) => j === optionIndex ? value : opt) }
        : q
    ));
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate questions
      const validQuestions = questions.filter(q => 
        q.question_text.trim() && q.correct_answer.trim()
      );

      if (validQuestions.length === 0) {
        toast({
          title: "خطأ",
          description: "يجب إضافة سؤال واحد على الأقل",
          variant: "destructive"
        });
        return;
      }

      let assignmentId = assignment?.id;

      if (assignment?.id) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from('assignments')
          .update({
            title: formData.title,
            description: formData.description || null,
            instructions: formData.instructions || null,
            max_score: formData.max_score,
            is_active: formData.is_active
          })
          .eq('id', assignment.id);

        if (updateError) throw updateError;
      } else {
        // Create new assignment
        const { data: newAssignment, error: insertError } = await supabase
          .from('assignments')
          .insert({
            title: formData.title,
            description: formData.description || null,
            instructions: formData.instructions || null,
            course_id: courseId,
            max_score: formData.max_score,
            is_active: formData.is_active
          })
          .select()
          .single();

        if (insertError) throw insertError;
        assignmentId = newAssignment.id;

        // Link assignment to video if provided
        if (videoId && assignmentId) {
          const { error: videoAssignmentError } = await supabase
            .from('video_assignments')
            .insert({
              video_id: videoId,
              assignment_id: assignmentId,
              trigger_at_percentage: 100,
              is_required: true
            });

          if (videoAssignmentError) throw videoAssignmentError;
        }
      }

      // Update questions
      if (assignmentId) {
        // Delete existing questions
        await supabase
          .from('assignment_questions')
          .delete()
          .eq('assignment_id', assignmentId);

        // Insert new questions
        const questionsToInsert = validQuestions.map((q, index) => ({
          assignment_id: assignmentId,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.question_type === 'multiple_choice' ? q.options : [],
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: index
        }));

        const { error: questionsError } = await supabase
          .from('assignment_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      toast({
        title: "تم بنجاح",
        description: assignment?.id ? "تم تحديث الواجب بنجاح" : "تم إنشاء الواجب بنجاح"
      });

      onAssignmentSaved();
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ بيانات الواجب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="arabic-heading flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {assignment?.id ? 'تعديل الواجب' : 'إنشاء واجب جديد'}
          {videoId && <Badge variant="secondary">مرتبط بفيديو</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold arabic-heading">تفاصيل الواجب</h3>
            
            <div>
              <Label htmlFor="title" className="arabic-text">عنوان الواجب</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل عنوان الواجب"
                className="arabic-text"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="arabic-text">وصف الواجب</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أدخل وصف الواجب"
                className="arabic-text"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="instructions" className="arabic-text">تعليمات الواجب</Label>
              <Textarea
                id="instructions"
                value={formData.instructions || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="أدخل تعليمات تفصيلية للواجب"
                className="arabic-text"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="max_score" className="arabic-text">الدرجة الكاملة</Label>
              <Input
                id="max_score"
                type="number"
                value={formData.max_score || 100}
                onChange={(e) => setFormData(prev => ({ ...prev, max_score: parseInt(e.target.value) || 100 }))}
                min="1"
                className="arabic-text"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold arabic-heading">أسئلة الواجب</h3>
              <Button
                type="button"
                variant="outline"
                onClick={addNewQuestion}
                className="arabic-text"
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة سؤال
              </Button>
            </div>

            {questions.map((question, questionIndex) => (
              <Card key={questionIndex} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold arabic-text">السؤال {questionIndex + 1}</h4>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label className="arabic-text">نص السؤال</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(questionIndex, 'question_text', e.target.value)}
                        placeholder="أدخل نص السؤال"
                        className="arabic-text"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="arabic-text">نوع السؤال</Label>
                        <Select
                          value={question.question_type}
                          onValueChange={(value) => updateQuestion(questionIndex, 'question_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">اختيار من متعدد</SelectItem>
                            <SelectItem value="true_false">صحيح أو خطأ</SelectItem>
                            <SelectItem value="short_answer">إجابة قصيرة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="arabic-text">النقاط</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value) || 1)}
                          min="1"
                          className="arabic-text"
                        />
                      </div>
                    </div>

                    {question.question_type === 'multiple_choice' && (
                      <div className="space-y-2">
                        <Label className="arabic-text">الخيارات</Label>
                        {question.options.map((option, optionIndex) => (
                          <Input
                            key={optionIndex}
                            value={option}
                            onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                            placeholder={`الخيار ${optionIndex + 1}`}
                            className="arabic-text"
                          />
                        ))}
                      </div>
                    )}

                    <div>
                      <Label className="arabic-text">الإجابة الصحيحة</Label>
                      {question.question_type === 'multiple_choice' ? (
                        <Select
                          value={question.correct_answer}
                          onValueChange={(value) => updateQuestion(questionIndex, 'correct_answer', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الإجابة الصحيحة" />
                          </SelectTrigger>
                          <SelectContent>
                            {question.options.map((option, index) => (
                              option && (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              )
                            ))}
                          </SelectContent>
                        </Select>
                      ) : question.question_type === 'true_false' ? (
                        <Select
                          value={question.correct_answer}
                          onValueChange={(value) => updateQuestion(questionIndex, 'correct_answer', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الإجابة الصحيحة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">صحيح</SelectItem>
                            <SelectItem value="false">خطأ</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={question.correct_answer}
                          onChange={(e) => updateQuestion(questionIndex, 'correct_answer', e.target.value)}
                          placeholder="أدخل الإجابة الصحيحة"
                          className="arabic-text"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 arabic-text"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {assignment?.id ? 'تحديث الواجب' : 'إنشاء الواجب'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="arabic-text"
            >
              <X className="h-4 w-4 mr-2" />
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AssignmentQuizForm;
