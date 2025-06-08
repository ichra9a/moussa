
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface GlobalNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const NotificationCenter = () => {
  const { student } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [globalNotifications, setGlobalNotifications] = useState<GlobalNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      fetchNotifications();
      fetchGlobalNotifications();
      
      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `student_id=eq.${student.id}`
          },
          (payload) => {
            console.log('New notification received:', payload);
            fetchNotifications();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'global_notifications'
          },
          (payload) => {
            console.log('New global notification received:', payload);
            fetchGlobalNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [student]);

  const fetchNotifications = async () => {
    if (!student) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (data) {
        console.log('Fetched notifications:', data);
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchGlobalNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('global_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching global notifications:', error);
        return;
      }

      if (data) {
        console.log('Fetched global notifications:', data);
        setGlobalNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching global notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!student) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('student_id', student.id);

      if (!error) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!student) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('student_id', student.id);

      if (!error) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">الإشعارات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 arabic-heading">
          <Bell className="h-5 w-5" />
          الإشعارات
          {unreadCount > 0 && (
            <Badge variant="destructive" className="arabic-text">
              {unreadCount} جديد
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global Notifications */}
        {globalNotifications.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-600 arabic-text">إعلانات عامة</h4>
            {globalNotifications.map((notification) => (
              <div key={notification.id} className="border rounded-lg p-3 bg-blue-50">
                <div className="flex items-start gap-2">
                  {getTypeIcon(notification.type)}
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm arabic-text">{notification.title}</h5>
                    <p className="text-sm text-gray-600 arabic-text mt-1">{notification.message}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(notification.created_at).toLocaleDateString('ar')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Personal Notifications */}
        {notifications.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-600 arabic-text">إشعاراتك الشخصية</h4>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-3 transition-colors ${
                  notification.is_read ? 'bg-gray-50' : 'bg-white border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {getTypeIcon(notification.type)}
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm arabic-text">{notification.title}</h5>
                    <p className="text-sm text-gray-600 arabic-text mt-1">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleDateString('ar')}
                      </span>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs"
                          >
                            تحديد كمقروء
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4 arabic-text">
            لا توجد إشعارات شخصية
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
