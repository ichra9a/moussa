
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question_text: string;
  correct_answer: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface VideoVerificationQuizProps {
  videoId: string;
  onQuizComplete: () => void;
}

const VideoVerificationQuiz = ({ videoId, onQuizComplete }: VideoVerificationQuizProps) => {
  const { student } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student && videoId) {
      fetchQuestions();
    }
  }, [student, videoId]);

  const fetchQuestions = async () => {
    try {
      const { data: questionsData, error } = await supabase
        .from('video_verification_questions')
        .select('*')
        .eq('video_id', videoId);

      if (error) throw error;

      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData);
        
        // Check if student already answered
        const { data: answersData } = await supabase
          .from('student_verification_answers')
          .select('*')
          .eq('student_id', student!.id)
          .in('question_id', questionsData.map(q => q.id));

        if (answersData && answersData.length === questionsData.length) {
          const allCorrect = answersData.every(answer => answer.is_correct);
          if (allCorrect) {
            setIsCompleted(true);
            onQuizComplete();
          }
        }
      } else {
        // No questions for this video, mark as completed
        setIsCompleted(true);
        onQuizComplete();
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const selectedAnswer = selectedAnswers[questionId];
    if (!selectedAnswer) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = selectedAnswer === question.correct_answer;

    try {
      const { error } = await supabase
        .from('student_verification_answers')
        .upsert({
          student_id: student!.id,
          question_id: questionId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect
        });

      if (error) throw error;

      setSubmittedAnswers(prev => ({
        ...prev,
        [questionId]: isCorrect
      }));

      if (isCorrect) {
        toast({
          title: "إجابة صحيحة! ✓",
          description: "يمكنك الانتقال للسؤال التالي",
        });

        // Move to next question or complete quiz
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // Check if all answers are correct
          const allAnswered = questions.every(q => submittedAnswers[q.id] === true || q.id === questionId);
          if (allAnswered) {
            setIsCompleted(true);
            toast({
              title: "تهانينا! 🎉",
              description: "لقد أجبت على جميع الأسئلة بشكل صحيح. يمكنك الآن مشاهدة الفيديو التالي",
            });
            onQuizComplete();
          }
        }
      } else {
        toast({
          title: "إجابة خاطئة ✗",
          description: "حاول مرة أخرى",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإجابة",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="arabic-text text-gray-600">جاري تحميل الأسئلة...</p>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0 || isCompleted) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = submittedAnswers[currentQuestion.id] === true;
  const selectedAnswer = selectedAnswers[currentQuestion.id];

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="arabic-heading flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-600" />
            أسئلة التحقق من المشاهدة
          </CardTitle>
          <Badge variant="outline" className="arabic-text">
            السؤال {currentQuestionIndex + 1} من {questions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-lg">
          <h3 className="font-medium arabic-text mb-4">{currentQuestion.question_text}</h3>
          
          <div className="space-y-3">
            {[
              { key: 'A', text: currentQuestion.option_a },
              { key: 'B', text: currentQuestion.option_b },
              { key: 'C', text: currentQuestion.option_c },
              { key: 'D', text: currentQuestion.option_d }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => handleAnswerSelect(currentQuestion.id, option.key)}
                disabled={isAnswered}
                className={`w-full p-3 text-right rounded-lg border-2 transition-colors arabic-text ${
                  selectedAnswer === option.key
                    ? isAnswered
                      ? submittedAnswers[currentQuestion.id]
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.text}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{option.key}</span>
                    {selectedAnswer === option.key && isAnswered && (
                      submittedAnswers[currentQuestion.id] ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedAnswer && !isAnswered && (
            <Button
              onClick={() => handleSubmitAnswer(currentQuestion.id)}
              className="w-full mt-4 arabic-text"
            >
              تأكيد الإجابة
            </Button>
          )}

          {isAnswered && !submittedAnswers[currentQuestion.id] && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 arabic-text text-sm">
                الإجابة الصحيحة هي: <strong>{currentQuestion.correct_answer}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 arabic-text">
            يجب الإجابة على جميع الأسئلة بشكل صحيح لمتابعة مشاهدة الفيديوهات التالية
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoVerificationQuiz;
