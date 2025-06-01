
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VideoCard from './VideoCard';

interface FeaturedCategoriesProps {
  onVideoSelect: (video: any) => void;
  searchQuery: string;
}

const FeaturedCategories = ({ onVideoSelect, searchQuery }: FeaturedCategoriesProps) => {
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [categories, setCategories] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch videos with categories
      const { data: videosData } = await supabase
        .from('videos')
        .select(`
          *,
          categories (
            id,
            name,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (categoriesData) {
        setCategories([
          { id: 'all', name: 'الكل', color: 'bg-slate-100 text-slate-800' },
          ...categoriesData.map(cat => ({
            ...cat,
            color: getCategoryColor(cat.name)
          }))
        ]);
      }

      if (videosData) {
        const transformedVideos = videosData.map(video => ({
          id: video.youtube_id,
          title: video.title,
          description: video.description || '',
          category: video.categories?.name || 'غير مصنف',
          thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`,
          duration: '10:00', // You might want to fetch this from YouTube API
          youtube_url: video.youtube_url,
          youtube_id: video.youtube_id,
          views: video.views || 0
        }));
        setVideos(transformedVideos);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const colors = {
      'العقلية والتطوير الذاتي': 'bg-blue-100 text-blue-800',
      'اللياقة البدنية والصحة': 'bg-green-100 text-green-800',
      'الإنتاجية والتنظيم': 'bg-purple-100 text-purple-800',
      'القيادة والأعمال': 'bg-pink-100 text-pink-800'
    };
    return colors[categoryName as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'الكل' || video.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <section id="categories" className="bg-slate-50 py-16 font-cairo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-500 arabic-text">جاري التحميل...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="bg-slate-50 py-16 font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mobile-app">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-slate-900 arabic-heading">الفئات المميزة</h2>
          <p className="text-slate-600 max-w-2xl mx-auto arabic-text">
            استكشف مجموعتنا المنسقة من فيديوهات التدريب المنظمة حسب الموضوع.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 px-4 md:px-0">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-6 py-3 rounded-full font-medium transition-smooth arabic-text mobile-touch ${
                selectedCategory === category.name
                  ? 'bg-blue-600 text-white shadow-md'
                  : category.color + ' hover:scale-105'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Videos Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mobile-grid">
          {filteredVideos.map((video, index) => (
            <div key={index} className="mobile-card">
              <VideoCard
                video={video}
                onSelect={() => onVideoSelect(video)}
              />
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg arabic-text">لم يتم العثور على فيديوهات تطابق بحثك.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;
