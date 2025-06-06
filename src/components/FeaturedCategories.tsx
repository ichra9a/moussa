
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Clock, Eye } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  youtube_id: string;
  thumbnail: string;
  views: number;
  duration_seconds: number;
  category: {
    id: string;
    name: string;
  };
}

const FeaturedCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchVideos();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error in fetchCategories:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          youtube_url,
          youtube_id,
          thumbnail,
          views,
          duration_seconds,
          categories!videos_category_id_fkey (
            id,
            name
          )
        `)
        .not('category_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      if (data) {
        const formattedVideos = data
          .filter(video => video.categories) // Only include videos with categories
          .map(video => ({
            id: video.id,
            title: video.title,
            description: video.description || '',
            youtube_url: video.youtube_url,
            youtube_id: video.youtube_id,
            thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`,
            views: video.views || 0,
            duration_seconds: video.duration_seconds || 0,
            category: {
              id: video.categories.id,
              name: video.categories.name
            }
          }));
        
        setVideos(formattedVideos);
      }
    } catch (error) {
      console.error('Error in fetchVideos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredVideos = selectedCategory 
    ? videos.filter(video => video.category.id === selectedCategory)
    : videos;

  if (loading) {
    return (
      <section className="py-20 bg-gray-50" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 arabic-heading">
              التصنيفات المميزة
            </h2>
            <p className="text-xl text-gray-600 arabic-text">
              استكشف مجموعة متنوعة من المحتوى التعليمي
            </p>
          </div>
          <div className="animate-pulse space-y-8">
            <div className="flex flex-wrap gap-4 justify-center">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded-full w-32"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 arabic-heading">
            التصنيفات المميزة
          </h2>
          <p className="text-xl text-gray-600 arabic-text">
            استكشف مجموعة متنوعة من المحتوى التعليمي
          </p>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('')}
            className="arabic-text rounded-full px-6 py-2"
          >
            جميع التصنيفات
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className="arabic-text rounded-full px-6 py-2"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full bg-white text-black hover:bg-gray-100"
                    onClick={() => window.open(video.youtube_url, '_blank')}
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                </div>
                {video.duration_seconds > 0 && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(video.duration_seconds)}
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full arabic-text">
                    {video.category.name}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2 arabic-text line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 arabic-text line-clamp-3">
                  {video.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Eye className="h-4 w-4" />
                    <span>{video.views.toLocaleString()} مشاهدة</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(video.youtube_url, '_blank')}
                    className="arabic-text"
                  >
                    مشاهدة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg arabic-text">
              لا توجد فيديوهات في هذا التصنيف حالياً
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;
