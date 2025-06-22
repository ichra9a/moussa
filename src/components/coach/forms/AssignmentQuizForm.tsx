
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Save, X, Trash2 } from 'lucide-react';

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
  max_score: number;
  course_id?: string;
  module_id?: string;
}

interface AssignmentQuizFormProps {
  assignment?: Assignment | null;
  courseId: string;
  onAssignmentSaved: () => void;
  onCancel: () => void;
}

const AssignmentQuizForm = ({ assignment, courseId, onAssignmentSaved, onCancel }: AssignmentQuizFormProps) => {
  const [formData, setFormData] = useState<Assignment>({
    title: '',
    description: '',
    instructions: '',
    max_score: 100,
    course_id: courseId
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
        course_id: assignment.course_id || courseId,
        module_id: assignment.module_id
      });
      
      if (assignment.id) {
        fetchQuestions(assignment.id);
      }
    }
  }, [assignment, courseId]);

  const fetchQuestions = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('assignment_questions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('order_index');

      if (error) throw error;

      const formattedQuestions: Question[] = data?.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type as Question['question_type'],
        options: Array.isArray(q.options) ? q.options.filter(opt => typeof opt === 'string') : [],
        correct_answer: q.correct_answer,
        points: q.points,
        order_index: q.order_index
      })) || [];

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleInputChange = (field: keyof Assignment, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
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
    setQuestions(prev => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate total score
      const totalScore = questions.reduce((sum, q) => sum + q.points, 0);
      
      let assignmentId = assignment?.id;

      if (assignment?.id) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from('assignments')
          .update({
            title: formData.title,
            description: formData.description || null,
            instructions: formData.instructions || null,
            max_score: totalScore,
            course_id: formData.course_id
          })
          .eq('id', assignment.id);

        if (updateError) throw updateError;

        // Delete existing questions
        const { error: deleteError } = await supabase
          .from('assignment_questions')
          .delete()
          .eq('assignment_id', assignment.id);

        if (deleteError) throw deleteError;
      } else {
        // Create new assignment
        const { data: newAssignment, error: insertError } = await supabase
          .from('assignments')
          .insert({
            title: formData.title,
            description: formData.description || null,
            instructions: formData.instructions || null,
            max_score: totalScore,
            course_id: formData.course_id,
            module_id: formData.module_id
          })
          .select()
          .single();

        if (insertError) throw insertError;
        assignmentId = newAssignment.id;
      }

      // Insert questions
      if (questions.length > 0 && assignmentId) {
        const questionsToInsert = questions.map(q => ({
          assignment_id: assignmentId,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: q.order_index
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
        description: "حدث خطأ أثناء حفظ الواجب",
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
                onChange={(e) => handleInputChange('title', e.target.value)}
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
                onChange={(e) => handleInputChange('description', e.target.value)}
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
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="أدخل تعليمات مفصلة للطلاب"
                className="arabic-text"
                rows={4}
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold arabic-heading">أسئلة الواجب</h3>
              <Button type="button" onClick={addQuestion} className="arabic-text">
                <Plus className="h-4 w-4 mr-2" />
                إضافة سؤال
              </Button>
            </div>

            {questions.map((question, questionIndex) => (
              <Card key={questionIndex} className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold arabic-text">السؤال {questionIndex + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                            <SelectItem value="multiple_choice">اختيار متعدد</SelectItem>
                            <SelectItem value="true_false">صحيح/خطأ</SelectItem>
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
                          <div key={optionIndex} className="flex items-center gap-2">
                            <span className="text-sm w-8">{String.fromCharCode(65 + optionIndex)}</span>
                            <Input
                              value={option}
                              onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                              placeholder={`الخيار ${String.fromCharCode(65 + optionIndex)}`}
                              className="arabic-text"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <Label className="arabic-text">الإجابة الصحيحة</Label>
                      {question.question_type === 'true_false' ? (
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
