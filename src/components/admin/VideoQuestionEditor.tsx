
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import VideoVerificationForm from './VideoVerificationForm';

interface VerificationQuestion {
  id?: string;
  question_text: string;
  correct_answer: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface VideoQuestionEditorProps {
  videoId: string;
  videoTitle: string;
  onQuestionsUpdated: () => void;
}

const VideoQuestionEditor = ({ videoId, videoTitle, onQuestionsUpdated }: VideoQuestionEditorProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [questions, setQuestions] = useState<VerificationQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [videoId]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('video_verification_questions')
        .select('*')
        .eq('video_id', videoId);

      if (error) throw error;

      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleSaveQuestions = async () => {
    setLoading(true);
    try {
      // Delete existing questions
      await supabase
        .from('video_verification_questions')
        .delete()
        .eq('video_id', videoId);

      // Insert new questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map(q => ({
          video_id: videoId,
          question_text: q.question_text,
          correct_answer: q.correct_answer,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d
        }));

        const { error } = await supabase
          .from('video_verification_questions')
          .insert(questionsToInsert);

        if (error) throw error;
      }

      toast({
        title: "تم الحفظ",
        description: "تم حفظ أسئلة التحقق بنجاح"
      });

      setIsEditing(false);
      onQuestionsUpdated();
    } catch (error) {
      console.error('Error saving questions:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الأسئلة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 border-orange-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm arabic-text">
            أسئلة التحقق - {videoTitle}
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="arabic-text"
              >
                <Edit className="h-4 w-4 ml-2" />
                تعديل الأسئلة
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleSaveQuestions}
                  disabled={loading}
                  className="arabic-text"
                >
                  <Save className="h-4 w-4 ml-2" />
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    fetchQuestions();
                  }}
                  className="arabic-text"
                >
                  <X className="h-4 w-4" />
                  إلغاء
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <VideoVerificationForm
            questions={questions}
            onQuestionsChange={setQuestions}
          />
        ) : (
          <div className="space-y-3">
            {questions.length > 0 ? (
              questions.map((question, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium arabic-text mb-2">
                    السؤال {index + 1}: {question.question_text}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="arabic-text">أ: {question.option_a}</p>
                    <p className="arabic-text">ب: {question.option_b}</p>
                    <p className="arabic-text">ج: {question.option_c}</p>
                    <p className="arabic-text">د: {question.option_d}</p>
                  </div>
                  <p className="text-sm text-green-600 arabic-text mt-1">
                    الإجابة الصحيحة: {question.correct_answer}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 arabic-text text-sm">
                لا توجد أسئلة تحقق لهذا الفيديو
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoQuestionEditor;
