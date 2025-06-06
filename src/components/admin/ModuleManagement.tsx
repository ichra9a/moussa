
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Video, Save, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: string;
  title: string;
  description: string;
  course_id: string;
  order_index: number;
  is_active: boolean;
}

interface Video {
  id: string;
  title: string;
  youtube_url: string;
  youtube_id: string;
}

interface Course {
  id: string;
  title: string;
}

interface ModuleManagementProps {
  courses: Course[];
}

const ModuleManagement = ({ courses }: ModuleManagementProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    course_id: ''
  });
  const [newVideo, setNewVideo] = useState({
    title: '',
    youtube_url: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchModules();
    fetchVideos();
  }, [selectedCourse]);

  const fetchModules = async () => {
    const query = supabase.from('modules').select('*').order('order_index');
    
    if (selectedCourse && selectedCourse !== 'all') {
      query.eq('course_id', selectedCourse);
    }
    
    const { data } = await query;
    if (data) setModules(data);
  };

  const fetchVideos = async () => {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (data) setVideos(data);
  };

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleCreateModule = async () => {
    if (!newModule.title.trim() || !newModule.course_id) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان المودول واختيار الدورة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('modules')
        .insert({
          title: newModule.title,
          description: newModule.description,
          course_id: newModule.course_id,
          order_index: modules.length
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء المودول بنجاح"
      });

      setNewModule({ title: '', description: '', course_id: '' });
      setShowCreateModule(false);
      fetchModules();
    } catch (error) {
      console.error('Error creating module:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء المودول",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideoToModule = async (moduleId: string) => {
    if (!newVideo.title.trim() || !newVideo.youtube_url.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الفيديو ورابط اليوتيوب",
        variant: "destructive"
      });
      return;
    }

    const youtubeId = extractYouTubeId(newVideo.youtube_url);
    if (!youtubeId) {
      toast({
        title: "خطأ",
        description: "رابط اليوتيوب غير صحيح",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First create the video
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          title: newVideo.title,
          youtube_url: newVideo.youtube_url,
          youtube_id: youtubeId,
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Then link it to the module
      const { error: linkError } = await supabase
        .from('module_videos')
        .insert({
          module_id: moduleId,
          video_id: videoData.id,
          order_index: 0
        });

      if (linkError) throw linkError;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الفيديو للمودول بنجاح"
      });

      setNewVideo({ title: '', youtube_url: '' });
      setShowAddVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الفيديو",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المودول؟')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف المودول بنجاح"
      });

      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المودول",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      {/* Course Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">تصفية حسب الدورة</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="arabic-text">
              <SelectValue placeholder="اختر دورة لعرض مودولاتها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الدورات</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Create Module */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-heading">
            <Video className="h-5 w-5" />
            إدارة المودولات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setShowCreateModule(!showCreateModule)}
            className="arabic-text"
          >
            <Plus className="ml-2 h-4 w-4" />
            إنشاء مودول جديد
          </Button>

          {showCreateModule && (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="arabic-text">عنوان المودول</Label>
                  <Input
                    value={newModule.title}
                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                    placeholder="أدخل عنوان المودول"
                    className="arabic-text"
                  />
                </div>
                <div>
                  <Label className="arabic-text">الدورة</Label>
                  <Select value={newModule.course_id} onValueChange={(value) => setNewModule({ ...newModule, course_id: value })}>
                    <SelectTrigger className="arabic-text">
                      <SelectValue placeholder="اختر الدورة" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.filter(course => course.id && course.id.trim() !== '').map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="arabic-text">وصف المودول</Label>
                <Textarea
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  placeholder="أدخل وصف المودول"
                  className="arabic-text"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateModule} disabled={loading} className="arabic-text">
                  <Save className="ml-2 h-4 w-4" />
                  حفظ المودول
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModule(false)}
                  className="arabic-text"
                >
                  <X className="ml-2 h-4 w-4" />
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules List */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">المودولات الموجودة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modules.length === 0 ? (
              <p className="text-gray-500 arabic-text text-center py-4">
                لا توجد مودولات {selectedCourse && selectedCourse !== 'all' ? 'في هذه الدورة' : ''}
              </p>
            ) : (
              modules.map((module) => (
                <div key={module.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold arabic-text">{module.title}</h3>
                      <p className="text-sm text-gray-600 arabic-text">{module.description}</p>
                      <Badge variant={module.is_active ? "default" : "secondary"} className="mt-1">
                        {module.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowAddVideo(showAddVideo === module.id ? null : module.id)}
                        className="arabic-text"
                      >
                        <Video className="h-4 w-4 ml-1" />
                        إضافة فيديو
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteModule(module.id)}
                        className="arabic-text"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {showAddVideo === module.id && (
                    <div className="border-t pt-3 space-y-3 bg-blue-50 p-3 rounded">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="arabic-text">عنوان الفيديو</Label>
                          <Input
                            value={newVideo.title}
                            onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                            placeholder="أدخل عنوان الفيديو"
                            className="arabic-text"
                          />
                        </div>
                        <div>
                          <Label className="arabic-text">رابط اليوتيوب</Label>
                          <Input
                            value={newVideo.youtube_url}
                            onChange={(e) => setNewVideo({ ...newVideo, youtube_url: e.target.value })}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="arabic-text"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAddVideoToModule(module.id)} 
                          disabled={loading}
                          className="arabic-text"
                        >
                          <Save className="ml-1 h-4 w-4" />
                          إضافة الفيديو
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setShowAddVideo(null)}
                          className="arabic-text"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleManagement;
