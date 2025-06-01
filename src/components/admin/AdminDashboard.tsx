
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Video, Folder, LogOut } from 'lucide-react';
import AdminVideoForm from './AdminVideoForm';
import AdminCategoryForm from './AdminCategoryForm';
import VideoManagement from './VideoManagement';
import CategoryManagement from './CategoryManagement';

// Define types based on the database schema
interface Category {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_id: string;
  thumbnail: string | null;
  category_id: string | null;
  views: number | null;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

const AdminDashboard = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchVideos();
    fetchCategories();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        categories (
          id,
          name,
          description,
          thumbnail
        )
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setVideos(data);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleVideoSaved = () => {
    fetchVideos();
    setShowVideoForm(false);
    setEditingVideo(null);
  };

  const handleCategorySaved = () => {
    fetchCategories();
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    setShowVideoForm(true);
    setActiveTab('videos');
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
    setActiveTab('categories');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-cairo" dir="rtl">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-slate-900 arabic-heading">لوحة التحكم الإدارية</h1>
            <Button
              onClick={handleLogout}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="arabic-text">نظرة عامة</TabsTrigger>
            <TabsTrigger value="videos" className="arabic-text">إدارة الفيديوهات</TabsTrigger>
            <TabsTrigger value="categories" className="arabic-text">إدارة الفئات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium arabic-text">إجمالي الفيديوهات</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{videos.length}</div>
                  <p className="text-xs text-muted-foreground arabic-text">فيديو في المنصة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium arabic-text">إجمالي الفئات</CardTitle>
                  <Folder className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.length}</div>
                  <p className="text-xs text-muted-foreground arabic-text">فئة متاحة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium arabic-text">إجمالي المشاهدات</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {videos.reduce((sum, video) => sum + (video.views || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground arabic-text">مشاهدة إجمالية</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button
                onClick={() => {
                  setShowVideoForm(true);
                  setActiveTab('videos');
                }}
                className="h-24 text-lg arabic-text"
                size="lg"
              >
                <Plus className="ml-2" size={24} />
                إضافة فيديو جديد
              </Button>

              <Button
                onClick={() => {
                  setShowCategoryForm(true);
                  setActiveTab('categories');
                }}
                variant="outline"
                className="h-24 text-lg arabic-text"
                size="lg"
              >
                <Plus className="ml-2" size={24} />
                إضافة فئة جديدة
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold arabic-heading">إدارة الفيديوهات</h2>
              <Button
                onClick={() => setShowVideoForm(true)}
                className="arabic-text"
              >
                <Plus className="ml-2" size={16} />
                إضافة فيديو
              </Button>
            </div>

            {showVideoForm && (
              <AdminVideoForm
                video={editingVideo}
                categories={categories}
                onSave={handleVideoSaved}
                onCancel={() => {
                  setShowVideoForm(false);
                  setEditingVideo(null);
                }}
              />
            )}

            <VideoManagement
              videos={videos}
              onEdit={handleEditVideo}
              onRefresh={fetchVideos}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold arabic-heading">إدارة الفئات</h2>
              <Button
                onClick={() => setShowCategoryForm(true)}
                className="arabic-text"
              >
                <Plus className="ml-2" size={16} />
                إضافة فئة
              </Button>
            </div>

            {showCategoryForm && (
              <AdminCategoryForm
                category={editingCategory}
                onSave={handleCategorySaved}
                onCancel={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
              />
            )}

            <CategoryManagement
              categories={categories}
              onEdit={handleEditCategory}
              onRefresh={fetchCategories}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
