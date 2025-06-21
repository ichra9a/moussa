
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Users, BookOpen, Video, Settings, Globe, FileText, HelpCircle } from 'lucide-react';
import StudentManagement from './StudentManagement';
import CourseAdministration from './CourseAdministration';
import VideoManagement from './VideoManagement';
import CategoryManagement from './CategoryManagement';
import WebsiteEditor from './WebsiteEditor';
import AssignmentManagement from './AssignmentManagement';
import FAQManagement from './FAQManagement';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface Course {
  id: string;
  title: string;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCourses();
    fetchVideos();
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_active', true)
      .order('title');
    
    if (data) setCourses(data);
  };

  const fetchVideos = async () => {
    const { data } = await supabase
      .from('videos')
      .select(`
        *,
        categories (
          id,
          name,
          description,
          thumbnail,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false });
    
    if (data) setVideos(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setCategories(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-cairo" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-slate-900 arabic-heading">لوحة الإدارة</h1>
            <Button
              onClick={onLogout}
              variant="outline"
              className="flex items-center gap-2 arabic-text"
            >
              <LogOut size={16} />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="students" className="arabic-text flex items-center gap-2">
              <Users size={16} />
              الطلاب
            </TabsTrigger>
            <TabsTrigger value="courses" className="arabic-text flex items-center gap-2">
              <BookOpen size={16} />
              الدورات
            </TabsTrigger>
            <TabsTrigger value="assignments" className="arabic-text flex items-center gap-2">
              <FileText size={16} />
              الواجبات
            </TabsTrigger>
            <TabsTrigger value="videos" className="arabic-text flex items-center gap-2">
              <Video size={16} />
              الفيديوهات
            </TabsTrigger>
            <TabsTrigger value="categories" className="arabic-text flex items-center gap-2">
              <Settings size={16} />
              التصنيفات
            </TabsTrigger>
            <TabsTrigger value="faq" className="arabic-text flex items-center gap-2">
              <HelpCircle size={16} />
              الأسئلة الشائعة
            </TabsTrigger>
            <TabsTrigger value="website" className="arabic-text flex items-center gap-2">
              <Globe size={16} />
              الموقع
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentManagement />
          </TabsContent>

          <TabsContent value="courses">
            <CourseAdministration />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentManagement courses={courses} />
          </TabsContent>

          <TabsContent value="videos">
            <VideoManagement 
              videos={videos}
              onEdit={() => {}}
              onRefresh={fetchVideos}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement 
              categories={categories}
              onEdit={() => {}}
              onRefresh={fetchCategories}
            />
          </TabsContent>

          <TabsContent value="faq">
            <FAQManagement />
          </TabsContent>

          <TabsContent value="website">
            <WebsiteEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
