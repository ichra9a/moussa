
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Users, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Student {
  id: string;
  full_name: string;
  email: string;
  pin_code: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  student_id?: string;
  students?: {
    full_name: string;
  };
}

interface GlobalNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const NotificationManagement = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [globalNotifications, setGlobalNotifications] = useState<GlobalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [personalNotificationForm, setPersonalNotificationForm] = useState({
    student_id: '',
    title: '',
    message: '',
    type: 'info'
  });

  const [globalNotificationForm, setGlobalNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    fetchStudents();
    fetchNotifications();
    fetchGlobalNotifications();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          students!notifications_student_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchGlobalNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('global_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGlobalNotifications(data || []);
    } catch (error) {
      console.error('Error fetching global notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendPersonalNotification = async () => {
    if (!personalNotificationForm.student_id || !personalNotificationForm.title.trim() || !personalNotificationForm.message.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const notificationData = {
        student_id: personalNotificationForm.student_id,
        title: personalNotificationForm.title,
        message: personalNotificationForm.message,
        type: personalNotificationForm.type,
        is_read: false
      };

      console.log('Sending personal notification:', notificationData);

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) {
        console.error('Personal notification error:', error);
        throw error;
      }

      console.log('Personal notification sent successfully:', data);

      toast({
        title: "تم الإرسال",
        description: "تم إرسال الإشعار الشخصي بنجاح"
      });

      setPersonalNotificationForm({
        student_id: '',
        title: '',
        message: '',
        type: 'info'
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error sending personal notification:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الإشعار الشخصي",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sendGlobalNotification = async () => {
    if (!globalNotificationForm.title.trim() || !globalNotificationForm.message.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('global_notifications')
        .insert({
          title: globalNotificationForm.title,
          message: globalNotificationForm.message,
          type: globalNotificationForm.type
        });

      if (error) throw error;

      toast({
        title: "تم الإرسال",
        description: "تم إرسال الإعلان العام بنجاح"
      });

      setGlobalNotificationForm({
        title: '',
        message: '',
        type: 'info'
      });

      fetchGlobalNotifications();
    } catch (error) {
      console.error('Error sending global notification:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الإعلان العام",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sendBulkNotification = async () => {
    if (!globalNotificationForm.title.trim() || !globalNotificationForm.message.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Send personal notification to all students
      const notificationsToInsert = students.map(student => ({
        student_id: student.id,
        title: globalNotificationForm.title,
        message: globalNotificationForm.message,
        type: globalNotificationForm.type,
        is_read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notificationsToInsert);

      if (error) throw error;

      toast({
        title: "تم الإرسال",
        description: `تم إرسال الإشعار لجميع الطلاب (${students.length} طالب)`
      });

      setGlobalNotificationForm({
        title: '',
        message: '',
        type: 'info'
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الإشعار الجماعي",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold arabic-heading">إدارة الإشعارات</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 arabic-heading">
              <User className="h-5 w-5" />
              إرسال إشعار شخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">الطالب *</label>
              <Select 
                value={personalNotificationForm.student_id} 
                onValueChange={(value) => setPersonalNotificationForm({ ...personalNotificationForm, student_id: value })}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطالب" />
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
              <label className="block text-sm font-medium mb-2 arabic-text">العنوان *</label>
              <Input
                value={personalNotificationForm.title}
                onChange={(e) => setPersonalNotificationForm({ ...personalNotificationForm, title: e.target.value })}
                placeholder="عنوان الإشعار"
                className="arabic-text"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">الرسالة *</label>
              <Textarea
                value={personalNotificationForm.message}
                onChange={(e) => setPersonalNotificationForm({ ...personalNotificationForm, message: e.target.value })}
                placeholder="نص الرسالة"
                className="arabic-text"
                rows={3}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">نوع الإشعار</label>
              <Select 
                value={personalNotificationForm.type} 
                onValueChange={(value) => setPersonalNotificationForm({ ...personalNotificationForm, type: value })}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">معلومات</SelectItem>
                  <SelectItem value="success">نجاح</SelectItem>
                  <SelectItem value="warning">تحذير</SelectItem>
                  <SelectItem value="error">خطأ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={sendPersonalNotification}
              className="w-full arabic-text"
              disabled={submitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'جاري الإرسال...' : 'إرسال الإشعار'}
            </Button>
          </CardContent>
        </Card>

        {/* Global/Bulk Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 arabic-heading">
              <Users className="h-5 w-5" />
              إرسال إعلان عام أو جماعي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">العنوان *</label>
              <Input
                value={globalNotificationForm.title}
                onChange={(e) => setGlobalNotificationForm({ ...globalNotificationForm, title: e.target.value })}
                placeholder="عنوان الإعلان"
                className="arabic-text"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">الرسالة *</label>
              <Textarea
                value={globalNotificationForm.message}
                onChange={(e) => setGlobalNotificationForm({ ...globalNotificationForm, message: e.target.value })}
                placeholder="نص الرسالة"
                className="arabic-text"
                rows={3}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">نوع الإعلان</label>
              <Select 
                value={globalNotificationForm.type} 
                onValueChange={(value) => setGlobalNotificationForm({ ...globalNotificationForm, type: value })}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">معلومات</SelectItem>
                  <SelectItem value="success">نجاح</SelectItem>
                  <SelectItem value="warning">تحذير</SelectItem>
                  <SelectItem value="error">خطأ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button
                onClick={sendGlobalNotification}
                className="w-full arabic-text"
                disabled={submitting}
                variant="outline"
              >
                <Bell className="h-4 w-4 mr-2" />
                {submitting ? 'جاري الإرسال...' : 'إعلان عام (للجميع)'}
              </Button>

              <Button
                onClick={sendBulkNotification}
                className="w-full arabic-text"
                disabled={submitting}
              >
                <Users className="h-4 w-4 mr-2" />
                {submitting ? 'جاري الإرسال...' : `إشعار شخصي للجميع (${students.length} طالب)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="arabic-heading">الإشعارات الشخصية الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => (
                <div key={notification.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getTypeIcon(notification.type)}</span>
                        <h4 className="font-medium text-sm arabic-text">{notification.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 arabic-text mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>إلى: {notification.students?.full_name}</span>
                        <span>{new Date(notification.created_at).toLocaleDateString('ar')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-center text-gray-500 arabic-text">لا توجد إشعارات شخصية</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Global Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="arabic-heading">الإعلانات العامة الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {globalNotifications.slice(0, 10).map((notification) => (
                <div key={notification.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getTypeIcon(notification.type)}</span>
                        <h4 className="font-medium text-sm arabic-text">{notification.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 arabic-text mb-2">{notification.message}</p>
                      <div className="text-xs text-gray-400 text-left">
                        {new Date(notification.created_at).toLocaleDateString('ar')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {globalNotifications.length === 0 && (
                <p className="text-center text-gray-500 arabic-text">لا توجد إعلانات عامة</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationManagement;
