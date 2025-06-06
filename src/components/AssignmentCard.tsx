
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  instructions: string | null;
  max_score: number;
}

interface Submission {
  id: string;
  submission_content: string;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
}

interface AssignmentCardProps {
  assignment: Assignment;
  submission?: Submission;
  onSubmissionUpdate: () => void;
}

const AssignmentCard = ({ assignment, submission, onSubmissionUpdate }: AssignmentCardProps) => {
  const { student } = useAuth();
  const [submissionContent, setSubmissionContent] = useState(submission?.submission_content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!student || !submissionContent.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال محتوى الواجب",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (submission) {
        // Update existing submission
        const { error } = await supabase
          .from('assignment_submissions')
          .update({
            submission_content: submissionContent,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
          .eq('id', submission.id);

        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await supabase
          .from('assignment_submissions')
          .insert({
            assignment_id: assignment.id,
            student_id: student.id,
            submission_content: submissionContent
          });

        if (error) throw error;
      }

      toast({
        title: "تم بنجاح",
        description: "تم تسليم الواجب بنجاح"
      });

      onSubmissionUpdate();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسليم الواجب",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="default">تم التسليم</Badge>;
      case 'graded':
        return <Badge variant="secondary">تم التصحيح</Badge>;
      default:
        return <Badge variant="outline">في الانتظار</Badge>;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="arabic-heading flex items-center justify-between">
          <span>{assignment.title}</span>
          {submission && getStatusBadge(submission.status)}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          {assignment.due_date && (
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span className="arabic-text">
                موعد التسليم: {new Date(assignment.due_date).toLocaleDateString('ar-SA')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <FileText size={16} />
            <span className="arabic-text">الدرجة الكاملة: {assignment.max_score}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignment.description && (
          <p className="text-slate-700 arabic-text">{assignment.description}</p>
        )}
        
        {assignment.instructions && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold arabic-text mb-2">تعليمات الواجب:</h4>
            <p className="text-slate-700 arabic-text">{assignment.instructions}</p>
          </div>
        )}

        {submission?.score !== null && submission?.status === 'graded' && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="font-semibold arabic-text">
                النتيجة: {submission.score} / {assignment.max_score}
              </span>
            </div>
            {submission.feedback && (
              <p className="text-slate-700 arabic-text">{submission.feedback}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium arabic-text">إجابتك:</label>
          <Textarea
            value={submissionContent}
            onChange={(e) => setSubmissionContent(e.target.value)}
            placeholder="اكتب إجابتك هنا..."
            rows={4}
            className="arabic-text"
            disabled={submission?.status === 'graded'}
          />
        </div>

        {submission?.status !== 'graded' && (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !submissionContent.trim()}
            className="arabic-text"
          >
            <Send size={16} className="mr-2" />
            {submission ? 'تحديث الإجابة' : 'تسليم الواجب'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentCard;
