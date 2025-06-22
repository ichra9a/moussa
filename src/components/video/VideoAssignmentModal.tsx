
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileText, CheckCircle, Clock, Award } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  max_score: number;
  questions: Question[];
}

interface VideoAssignmentModalProps {
  isOpen: boolean;
  videoId: string;
  studentId: string;
  onClose: () => void;
  onAssignmentComplete: () => void;
}

const VideoAssignmentModal = ({ 
  isOpen, 
  videoId, 
  studentId, 
  onClose, 
  onAssignmentComplete 
}: VideoAssignmentModalProps) => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && videoId && studentId) {
      fetchAssignment();
    }
  }, [isOpen, videoId, studentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);

      // Get assignment linked to this video
      const { data: videoAssignment } = await supabase
        .from('video_assignments')
        .select(`
          assignment_id,
          assignments (
            id,
            title,
            description,
            instructions,
            max_score
          )
        `)
        .eq('video_id', videoId)
        .eq('is_required', true)
        .single();

      if (!videoAssignment || !videoAssignment.assignments) {
        toast({
          title: "لا يوجد واجب",
          description: "لا يوجد واجب مرتبط بهذا الفيديو",
          variant: "destructive"
        });
        onClose();
        return;
      }

      // Get assignment questions
      const { data: questions } = await supabase
        .from('assignment_questions')
        .select('*')
        .eq('assignment_id', videoAssignment.assignments.id)
        .order('order_index');

      if (!questions || questions.length === 0) {
        toast({
          title: "لا توجد أسئلة",
          description: "هذا الواجب لا يحتوي على أسئلة",
          variant: "destructive"
        });
        onClose();
        return;
      }

      const assignmentData: Assignment = {
        id: videoAssignment.assignments.id,
        title: videoAssignment.assignments.title,
        description: videoAssignment.assignments.description,
        instructions: videoAssignment.assignments.instructions,
        max_score: videoAssignment.assignments.max_score,
        questions: questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type as Question['question_type'],
          options: Array.isArray(q.options) ? q.options : [],
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: q.order_index
        }))
      };

      setAssignment(assignmentData);

      // Check if student has already submitted this assignment
      const { data: existingAnswers } = await supabase
        .from('student_assignment_answers')
        .select('question_id, selected_answer, is_correct')
        .eq('student_id', studentId)
        .eq('assignment_id', assignmentData.id);

      if (existingAnswers && existingAnswers.length > 0) {
        // Student has already submitted
        const answerMap: Record<string, string> = {};
        let totalScore = 0;

        existingAnswers.forEach(answer => {
          answerMap[answer.question_id] = answer.selected_answer;
          if (answer.is_correct) {
            const question = questions.find(q => q.id === answer.question_id);
            totalScore += question?.points || 0;
          }
        });

        setAnswers(answerMap);
        setScore(totalScore);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات الواجب",
        variant: "destructive"
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!assignment) return;

    // Check if all questions are answered
    const unansweredQuestions = assignment.questions.filter(
      q => !answers[q.id] || answers[q.id].trim() === ''
    );

    if (unansweredQuestions.length > 0) {
      toast({
        title: "أسئلة غير مجاب عليها",
        description: `يجب الإجابة على جميع الأسئلة (${unansweredQuestions.length} سؤال متبقي)`,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Calculate score and prepare answers for submission
      let totalScore = 0;
      const answersToSubmit = assignment.questions.map(question => {
        const studentAnswer = answers[question.id];
        const isCorrect = studentAnswer.toLowerCase().trim() === 
                          question.correct_answer.toLowerCase().trim();
        
        if (isCorrect) {
          totalScore += question.points;
        }

        return {
          student_id: studentId,
          assignment_id: assignment.id,
          question_id: question.id,
          selected_answer: studentAnswer,
          is_correct: isCorrect
        };
      });

      // Submit answers
      const { error: answersError } = await supabase
        .from('student_assignment_answers')
        .insert(answersToSubmit);

      if (answersError) throw answersError;

      // Update assignment submission record
      const { error: submissionError } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: assignment.id,
          student_id: studentId,
          score: totalScore,
          status: 'submitted',
          submission_content: JSON.stringify(answers)
        });

      if (submissionError) throw submissionError;

      setScore(totalScore);
      setSubmitted(true);

      const percentage = Math.round((totalScore / assignment.max_score) * 100);
      
      toast({
        title: percentage >= 70 ? "تهانينا! 🎉" : "تم إرسال الواجب",
        description: `حصلت على ${totalScore} من ${assignment.max_score} نقاط (${percentage}%)`,
        variant: percentage >= 70 ? "default" : "destructive"
      });

      // If passed (70% or higher), allow progression
      if (percentage >= 70) {
        setTimeout(() => {
          onAssignmentComplete();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الواجب",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = assignment?.questions[currentQuestionIndex];
  const progress = assignment ? ((currentQuestionIndex + 1) / assignment.questions.length) * 100 : 0;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!assignment) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="arabic-heading flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {assignment.title}
            {submitted && <Badge variant="secondary">تم الإرسال</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Instructions */}
          {assignment.instructions && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="arabic-text text-blue-800">{assignment.instructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="arabic-text">التقدم في الواجب</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Score Display (if submitted) */}
          {submitted && score !== null && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <span className="font-semibold arabic-text">النتيجة:</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {score} / {assignment.max_score}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Question */}
          {currentQuestion && (
            <Card>
              <CardHeader>
                <CardTitle className="arabic-heading text-lg">
                  السؤال {currentQuestionIndex + 1} من {assignment.questions.length}
                  <Badge variant="outline" className="mr-2">
                    {currentQuestion.points} نقاط
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="arabic-text text-lg">{currentQuestion.question_text}</p>

                {currentQuestion.question_type === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    disabled={submitted}
                  >
                    {currentQuestion.options.map((option, index) => (
                      option && (
                        <div key={index} className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="arabic-text flex-1">
                            {option}
                          </Label>
                        </div>
                      )
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.question_type === 'true_false' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    disabled={submitted}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="true" id="true" />
                      <Label htmlFor="true" className="arabic-text">صحيح</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="false" id="false" />
                      <Label htmlFor="false" className="arabic-text">خطأ</Label>
                    </div>
                  </RadioGroup>
                )}

                {currentQuestion.question_type === 'short_answer' && (
                  <Textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="أدخل إجابتك هنا..."
                    className="arabic-text"
                    rows={3}
                    disabled={submitted}
                  />
                )}

                {/* Show correct answer if submitted */}
                {submitted && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600 arabic-text">
                      الإجابة الصحيحة: <span className="font-semibold">{currentQuestion.correct_answer}</span>
                    </p>
                    {answers[currentQuestion.id] === currentQuestion.correct_answer ? (
                      <div className="flex items-center gap-2 mt-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm arabic-text">إجابة صحيحة</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 text-red-600">
                        <X className="h-4 w-4" />
                        <span className="text-sm arabic-text">إجابة خاطئة</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation and Submit Buttons */}
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="arabic-text"
            >
              السؤال السابق
            </Button>

            <div className="flex gap-2">
              {currentQuestionIndex < assignment.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="arabic-text"
                >
                  السؤال التالي
                </Button>
              ) : !submitted ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="arabic-text"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  إرسال الواجب
                </Button>
              ) : (
                <Button onClick={onClose} className="arabic-text">
                  إغلاق
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoAssignmentModal;
