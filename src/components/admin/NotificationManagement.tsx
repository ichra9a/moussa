
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Send, Users, User, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  full_name: string;
  pin_code: string;
  email: string;
}

const NotificationManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [globalNotification, setGlobalNotification] = useState({
    title: '',
    message: '',
    type: 'info'
  });
  const [personalNotification, setPersonalNotification] = useState({
    title: '',
    message: '',
    type: 'info'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      if (data) setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب قائمة الطلاب",
        variant: "destructive"
      });
    }
  };

  const sendGlobalNotification = async () => {
    if (!globalNotification.title.trim() || !globalNotification.message.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان ونص الإشعار",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Send global notification first
      const { error: globalError } = await supabase
        .from('global_notifications')
        .insert({
          title: globalNotification.title,
          message: globalNotification.message,
          type: globalNotification.type
        });

      if (globalError) {
        console.error('Global notification error:', globalError);
        throw globalError;
      }

      // Send individual notifications to all students in batches
      if (students.length > 0) {
        const batchSize = 50; // Process in smaller batches to avoid timeout
        const batches = [];
        
        for (let i = 0; i < students.length; i += batchSize) {
          batches.push(students.slice(i, i + batchSize));
        }

        for (const batch of batches) {
          const studentNotifications = batch.map(student => ({
            student_id: student.id,
            title: globalNotification.title,
            message: globalNotification.message,
            type: globalNotification.type,
            is_read: false
          }));

          const { error: batchError } = await supabase
            .from('notifications')
            .insert(studentNotifications);

          if (batchError) {
            console.error('Batch notification error:', batchError);
            throw batchError;
          }
        }
      }

      toast({
        title: "تم الإرسال بنجاح",
        description: `تم إرسال الإشعار العام و ${students.length} إشعار شخصي`
      });

      setGlobalNotification({ title: '', message: '', type: 'info' });
    } catch (error) {
      console.error('Error sending global notification:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الإشعار العام",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendPersonalNotification = async () => {
    if (!personalNotification.title.trim() || !personalNotification.message.trim() || !selectedStudent) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          student_id: selectedStudent,
          title: personalNotification.title,
          message: personalNotification.message,
          type: personalNotification.type,
          is_read: false
        });

      if (error) {
        console.error('Personal notification error:', error);
        throw error;
      }

      const selectedStudentData = students.find(s => s.id === selectedStudent);
      toast({
        title: "تم الإرسال بنجاح",
        description: `تم إرسال الإشعار إلى ${selectedStudentData?.full_name || 'الطالب المحدد'}`
      });

      setPersonalNotification({ title: '', message: '', type: 'info' });
      setSelectedStudent('');
    } catch (error) {
      console.error('Error sending personal notification:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الإشعار الشخصي",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-heading">
            <Bell className="h-5 w-5" />
            إدارة الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="global">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="global" className="arabic-text">
                <Users className="h-4 w-4 ml-2" />
                إشعار عام لجميع الطلاب
              </TabsTrigger>
              <TabsTrigger value="personal" className="arabic-text">
                <User className="h-4 w-4 ml-2" />
                إشعار شخصي لطالب محدد
              </TabsTrigger>
            </TabsList>

            <TabsContent value="global" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label className="arabic-text">عنوان الإشعار</Label>
                  <Input
                    value={globalNotification.title}
                    onChange={(e) => setGlobalNotification({ ...globalNotification, title: e.target.value })}
                    placeholder="أدخل عنوان الإشعار"
                    className="arabic-text"
                    dir="rtl"
                  />
                </div>
                
                <div>
                  <Label className="arabic-text">نوع الإشعار</Label>
                  <Select 
                    value={globalNotification.type} 
                    onValueChange={(value) => setGlobalNotification({ ...globalNotification, type: value })}
                  >
                    <SelectTrigger className="arabic-text">
                      <SelectValue placeholder="اختر نوع الإشعار" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">معلومات</SelectItem>
                      <SelectItem value="success">نجاح</SelectItem>
                      <SelectItem value="warning">تحذير</SelectItem>
                      <SelectItem value="error">خطأ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="arabic-text">نص الإشعار</Label>
                  <Textarea
                    value={globalNotification.message}
                    onChange={(e) => setGlobalNotification({ ...globalNotification, message: e.target.value })}
                    placeholder="أدخل نص الإشعار"
                    className="arabic-text"
                    rows={4}
                    dir="rtl"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-semibold arabic-text">عدد الطلاب المستهدفين</p>
                    <p className="text-sm text-gray-600 arabic-text">سيتم إرسال الإشعار لجميع الطلاب المسجلين</p>
                  </div>
                  <Badge variant="secondary" className="arabic-text">
                    {students.length} طالب
                  </Badge>
                </div>

                <Button 
                  onClick={sendGlobalNotification} 
                  disabled={loading || !globalNotification.title.trim() || !globalNotification.message.trim()}
                  className="w-full arabic-text"
                >
                  <Send className="ml-2 h-4 w-4" />
                  {loading ? 'جاري الإرسال...' : 'إرسال الإشعار لجميع الطلاب'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="personal" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label className="arabic-text">اختر الطالب</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="arabic-text">
                      <SelectValue placeholder="اختر الطالب المستهدف" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.pin_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="arabic-text">عنوان الإشعار</Label>
                  <Input
                    value={personalNotification.title}
                    onChange={(e) => setPersonalNotification({ ...personalNotification, title: e.target.value })}
                    placeholder="أدخل عنوان الإشعار"
                    className="arabic-text"
                    dir="rtl"
                  />
                </div>

                <div>
                  <Label className="arabic-text">نوع الإشعار</Label>
                  <Select 
                    value={personalNotification.type} 
                    onValueChange={(value) => setPersonalNotification({ ...personalNotification, type: value })}
                  >
                    <SelectTrigger className="arabic-text">
                      <SelectValue placeholder="اختر نوع الإشعار" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">معلومات</SelectItem>
                      <SelectItem value="success">نجاح</SelectItem>
                      <SelectItem value="warning">تحذير</SelectItem>
                      <SelectItem value="error">خطأ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="arabic-text">نص الإشعار</Label>
                  <Textarea
                    value={personalNotification.message}
                    onChange={(e) => setPersonalNotification({ ...personalNotification, message: e.target.value })}
                    placeholder="أدخل نص الإشعار"
                    className="arabic-text"
                    rows={4}
                    dir="rtl"
                  />
                </div>

                <Button 
                  onClick={sendPersonalNotification} 
                  disabled={loading || !personalNotification.title.trim() || !personalNotification.message.trim() || !selectedStudent}
                  className="w-full arabic-text"
                >
                  <Send className="ml-2 h-4 w-4" />
                  {loading ? 'جاري الإرسال...' : 'إرسال الإشعار للطالب المحدد'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManagement;
