
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VideoCard from './VideoCard';

interface Video {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  youtube_url: string;
  thumbnail: string;
  duration_seconds: number;
  views: number;
  category: {
    id: string;
    name: string;
    description: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  videos: Video[];
}

interface FeaturedCategoriesProps {
  onVideoSelect: (video: any) => void;
  searchQuery: string;
}

const FeaturedCategories = ({ onVideoSelect, searchQuery }: FeaturedCategoriesProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // First get categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      // Then get videos that are linked to categories but NOT linked to any modules or courses
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          youtube_id,
          youtube_url,
          thumbnail,
          duration_seconds,
          views,
          category_id,
          categories(
            id,
            name,
            description
          )
        `)
        .not('category_id', 'is', null)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        return;
      }

      // Get videos that are linked to modules to exclude them
      const { data: moduleVideos, error: moduleVideosError } = await supabase
        .from('module_videos')
        .select('video_id');

      if (moduleVideosError) {
        console.error('Error fetching module videos:', moduleVideosError);
        return;
      }

      const moduleVideoIds = moduleVideos?.map(mv => mv.video_id) || [];

      // Filter out videos that are linked to modules
      const filteredVideos = videosData?.filter(video => 
        !moduleVideoIds.includes(video.id)
      ) || [];

      // Group videos by category
      const categoriesWithVideos = categoriesData?.map(category => ({
        ...category,
        videos: filteredVideos.filter(video => video.category_id === category.id)
          .map(video => ({
            ...video,
            category: video.categories
          })) || []
      })) || [];

      // Filter out categories with no videos
      const filteredCategories = categoriesWithVideos.filter(category => category.videos.length > 0);

      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error in fetchCategories:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    videos: category.videos.filter(video =>
      searchQuery === '' ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.videos.length > 0);

  if (loading) {
    return (
      <section className="py-20 bg-white font-cairo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 arabic-heading">الفئات المميزة</h2>
            <p className="text-xl text-slate-600 arabic-text">اكتشف مجموعة متنوعة من الدروس المفيدة</p>
          </div>
          <div className="animate-pulse space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-64 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (filteredCategories.length === 0) {
    return (
      <section className="py-20 bg-white font-cairo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 arabic-heading">الفئات المميزة</h2>
            <p className="text-xl text-slate-600 arabic-text">
              {searchQuery ? 'لم يتم العثور على نتائج للبحث' : 'لا توجد فئات متاحة حالياً'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 arabic-heading">الفئات المميزة</h2>
          <p className="text-xl text-slate-600 arabic-text">اكتشف مجموعة متنوعة من الدروس المفيدة</p>
        </div>

        <div className="space-y-16">
          {filteredCategories.map((category) => (
            <div key={category.id} className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2 arabic-heading">{category.name}</h3>
                {category.description && (
                  <p className="text-slate-600 arabic-text">{category.description}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.videos.slice(0, 6).map((video) => (
                  <VideoCard
                    key={video.id}
                    video={{
                      title: video.title,
                      description: video.description || '',
                      category: video.category.name,
                      thumbnail: video.thumbnail || '',
                      duration: formatDuration(video.duration_seconds || 0),
                      youtube_url: video.youtube_url,
                      youtube_id: video.youtube_id,
                      views: video.views
                    }}
                    onSelect={() => onVideoSelect({
                      id: video.youtube_id,
                      title: video.title,
                      thumbnail: video.thumbnail
                    })}
                  />
                ))}
              </div>

              {category.videos.length > 6 && (
                <div className="text-center">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors arabic-text">
                    عرض المزيد من {category.name}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
