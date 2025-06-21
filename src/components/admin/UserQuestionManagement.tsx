
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mail, Calendar, User, MessageSquare, CheckCircle, Clock, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserQuestion {
  id: string;
  full_name: string;
  email: string;
  question_text: string;
  submission_date: string;
  status: string;
  admin_response: string | null;
  faq_categories: {
    name: string;
  };
}

const UserQuestionManagement = () => {
  const [questions, setQuestions] = useState<UserQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<UserQuestion | null>(null);
  const [response, setResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('user_question_submissions')
      .select(`
        *,
        faq_categories (
          name
        )
      `)
      .order('submission_date', { ascending: false });
    
    if (data) setQuestions(data);
    setLoading(false);
  };

  const updateQuestionStatus = async (questionId: string, status: string, adminResponse?: string) => {
    const updateData: any = { status };
    if (adminResponse) {
      updateData.admin_response = adminResponse;
    }

    const { error } = await supabase
      .from('user_question_submissions')
      .update(updateData)
      .eq('id', questionId);

    if (error) {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث حالة السؤال",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "تم التحديث بنجاح",
      description: status === 'answered' ? "تم الرد على السؤال" : "تم تحديث حالة السؤال"
    });

    fetchQuestions();
    setSelectedQuestion(null);
    setResponse('');
  };

  const handleResponse = async () => {
    if (!selectedQuestion || !response.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رد على السؤال",
        variant: "destructive"
      });
      return;
    }

    await updateQuestionStatus(selectedQuestion.id, 'answered', response);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="arabic-text"><Clock className="w-3 h-3 mr-1" />في الانتظار</Badge>;
      case 'answered':
        return <Badge variant="default" className="arabic-text"><CheckCircle className="w-3 h-3 mr-1" />تم الرد</Badge>;
      default:
        return <Badge variant="outline" className="arabic-text">{status}</Badge>;
    }
  };

  const filteredQuestions = statusFilter === 'all' 
    ? questions 
    : questions.filter(q => q.status === statusFilter);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 arabic-heading">أسئلة المستخدمين</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 arabic-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">في الانتظار</SelectItem>
            <SelectItem value="answered">تم الرد</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2 arabic-text">
              لا توجد أسئلة
            </h3>
            <p className="text-gray-500 arabic-text">
              {statusFilter === 'all' ? 'لم يتم استلام أي أسئلة من المستخدمين بعد' : 'لا توجد أسئلة بهذه الحالة'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg arabic-text">
                      {question.question_text.substring(0, 100)}...
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span className="arabic-text">{question.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{question.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(question.submission_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="arabic-text w-fit">
                      {question.faq_categories.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(question.status)}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedQuestion(question);
                            setResponse(question.admin_response || '');
                          }}
                          className="arabic-text"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          عرض
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="arabic-heading">تفاصيل السؤال</DialogTitle>
                        </DialogHeader>
                        
                        {selectedQuestion && (
                          <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong className="arabic-text">الاسم:</strong>
                                  <span className="arabic-text mr-2">{selectedQuestion.full_name}</span>
                                </div>
                                <div>
                                  <strong>البريد الإلكتروني:</strong>
                                  <span className="mr-2">{selectedQuestion.email}</span>
                                </div>
                                <div>
                                  <strong className="arabic-text">التصنيف:</strong>
                                  <span className="arabic-text mr-2">{selectedQuestion.faq_categories.name}</span>
                                </div>
                                <div>
                                  <strong className="arabic-text">تاريخ الإرسال:</strong>
                                  <span className="mr-2">{new Date(selectedQuestion.submission_date).toLocaleDateString('ar-SA')}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2 arabic-text">نص السؤال:</h4>
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="arabic-text leading-relaxed">{selectedQuestion.question_text}</p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2 arabic-text">الرد على السؤال:</h4>
                              <Textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="اكتب ردك على السؤال هنا..."
                                rows={4}
                                className="arabic-text"
                              />
                            </div>

                            {selectedQuestion.admin_response && (
                              <div>
                                <h4 className="font-semibold mb-2 arabic-text">الرد السابق:</h4>
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <p className="arabic-text">{selectedQuestion.admin_response}</p>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-3 pt-4">
                              <Button
                                onClick={handleResponse}
                                disabled={!response.trim()}
                                className="arabic-text"
                              >
                                {selectedQuestion.status === 'answered' ? 'تحديث الرد' : 'إرسال الرد'}
                              </Button>
                              {selectedQuestion.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  onClick={() => updateQuestionStatus(selectedQuestion.id, 'answered')}
                                  className="arabic-text"
                                >
                                  تم الرد (بدون نص)
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserQuestionManagement;
