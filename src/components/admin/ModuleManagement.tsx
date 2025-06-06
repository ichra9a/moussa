import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Video, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  duration_seconds: number;
  thumbnail: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  course_id: string;
  is_active: boolean;
  courses: {
    title: string;
  };
  module_videos: Array<{
    id: string;
    order_index: number;
    videos: Video;
  }>;
}

interface Course {
  id: string;
  title: string;
}

interface ModuleManagementProps {
  courses: Course[];
}

const ModuleManagement = ({ courses: propCourses }: ModuleManagementProps) => {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>(propCourses || []);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    order_index: 1
  });
  const [selectedVideo, setSelectedVideo] = useState('');
  const [videoOrderIndex, setVideoOrderIndex] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchModules();
    if (!propCourses || propCourses.length === 0) {
      fetchCourses();
    }
    fetchVideos();
  }, [propCourses]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          courses!modules_course_id_fkey(title),
          module_videos(
            id,
            order_index,
            videos!module_videos_video_id_fkey(id, title, youtube_id, duration_seconds, thumbnail)
          )
        `)
        .order('order_index');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الوحدات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('title');

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.course_id) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (editingModule) {
        const { error } = await supabase
          .from('modules')
          .update({
            title: formData.title,
            description: formData.description,
            course_id: formData.course_id,
            order_index: formData.order_index
          })
          .eq('id', editingModule.id);

        if (error) throw error;
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث الوحدة بنجاح"
        });
      } else {
        const { error } = await supabase
          .from('modules')
          .insert({
            title: formData.title,
            description: formData.description,
            course_id: formData.course_id,
            order_index: formData.order_index,
            is_active: true
          });

        if (error) throw error;
        
        toast({
          title: "تم الإنشاء",
          description: "تم إنشاء الوحدة بنجاح"
        });
      }

      setFormData({ title: '', description: '', course_id: '', order_index: 1 });
      setEditingModule(null);
      setIsDialogOpen(false);
      fetchModules();
    } catch (error) {
      console.error('Error saving module:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الوحدة",
        variant: "destructive"
      });
    }
  };

  const handleAddVideoToModule = async (moduleId: string) => {
    if (!selectedVideo) {
      toast({
        title: "خطأ",
        description: "يجب اختيار فيديو",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('module_videos')
        .insert({
          module_id: moduleId,
          video_id: selectedVideo,
          order_index: videoOrderIndex
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة الفيديو للوحدة بنجاح"
      });

      setSelectedVideo('');
      setVideoOrderIndex(1);
      fetchModules();
    } catch (error) {
      console.error('Error adding video to module:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الفيديو",
        variant: "destructive"
      });
    }
  };

  const handleRemoveVideoFromModule = async (moduleVideoId: string) => {
    try {
      const { error } = await supabase
        .from('module_videos')
        .delete()
        .eq('id', moduleVideoId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الفيديو من الوحدة"
      });

      fetchModules();
    } catch (error) {
      console.error('Error removing video from module:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الفيديو",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return;

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الوحدة بنجاح"
      });

      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الوحدة",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold arabic-heading">إدارة الوحدات</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="arabic-text"
              onClick={() => {
                setEditingModule(null);
                setFormData({ title: '', description: '', course_id: '', order_index: 1 });
                setIsDialogOpen(true);
              }}
            >
              <Plus className="ml-2 h-4 w-4" />
              إضافة وحدة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="arabic-heading">
                {editingModule ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 arabic-text">العنوان *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="arabic-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 arabic-text">الوصف</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="arabic-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 arabic-text">الدورة *</label>
                <Select 
                  value={formData.course_id} 
                  onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدورة" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 arabic-text">ترتيب الوحدة</label>
                <Input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
                  min="1"
                  required
                />
              </div>
              <Button type="submit" className="w-full arabic-text">
                {editingModule ? 'تحديث الوحدة' : 'إضافة الوحدة'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {modules
          .sort((a, b) => a.order_index - b.order_index)
          .map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="arabic-heading">{module.title}</CardTitle>
                  <p className="text-sm text-gray-600 arabic-text mt-1">
                    من دورة: {module.courses.title}
                  </p>
                  {module.description && (
                    <p className="text-sm text-gray-600 arabic-text mt-2">{module.description}</p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    الترتيب: {module.order_index}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingModule(module);
                      setFormData({
                        title: module.title,
                        description: module.description || '',
                        course_id: module.course_id,
                        order_index: module.order_index
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(module.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Videos in this module */}
                <div>
                  <h4 className="font-medium arabic-text mb-3 flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    فيديوهات الوحدة ({module.module_videos?.length || 0})
                  </h4>
                  
                  {module.module_videos && module.module_videos.length > 0 ? (
                    <div className="space-y-2">
                      {module.module_videos
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((moduleVideo) => (
                        <div key={moduleVideo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">{moduleVideo.order_index}</span>
                            </div>
                            <div>
                              <p className="font-medium arabic-text">{moduleVideo.videos.title}</p>
                              <p className="text-sm text-gray-500">YouTube ID: {moduleVideo.videos.youtube_id}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://youtube.com/watch?v=${moduleVideo.videos.youtube_id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveVideoFromModule(moduleVideo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 arabic-text text-sm">لا توجد فيديوهات في هذه الوحدة</p>
                  )}
                </div>

                {/* Add video to module */}
                <div className="border-t pt-4">
                  <h5 className="font-medium arabic-text mb-3">إضافة فيديو للوحدة</h5>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر فيديو" />
                        </SelectTrigger>
                        <SelectContent>
                          {videos.map((video) => (
                            <SelectItem key={video.id} value={video.id}>
                              {video.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="ترتيب"
                        value={videoOrderIndex}
                        onChange={(e) => setVideoOrderIndex(parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>
                    <Button
                      onClick={() => handleAddVideoToModule(module.id)}
                      disabled={!selectedVideo}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModuleManagement;
