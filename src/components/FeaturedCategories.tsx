
import { useState } from 'react';
import VideoCard from './VideoCard';

interface FeaturedCategoriesProps {
  onVideoSelect: (video: any) => void;
  searchQuery: string;
}

const FeaturedCategories = ({ onVideoSelect, searchQuery }: FeaturedCategoriesProps) => {
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  const categories = [
    { id: 1, name: 'الكل', color: 'bg-slate-100 text-slate-800' },
    { id: 2, name: 'العقلية', color: 'bg-blue-100 text-blue-800' },
    { id: 3, name: 'الإنتاجية', color: 'bg-green-100 text-green-800' },
    { id: 4, name: 'القيادة', color: 'bg-purple-100 text-purple-800' },
    { id: 5, name: 'العافية', color: 'bg-pink-100 text-pink-800' },
    { id: 6, name: 'المهنة', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const videos = [
    {
      id: 'dQw4w9WgXcQ',
      title: 'بناء الثقة الراسخة',
      description: 'تعلم المبادئ الأساسية لتطوير الثقة بالنفس الدائمة في أي موقف.',
      category: 'العقلية',
      thumbnail: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&h=225&fit=crop',
      duration: '12:30'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'روتين النجاح الساعة 5 صباحاً',
      description: 'اكتشف كيف يمكن للاستيقاظ المبكر أن يحول إنتاجيتك ونتائج حياتك.',
      category: 'الإنتاجية',
      thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=225&fit=crop',
      duration: '15:45'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'القيادة في الأوقات الصعبة',
      description: 'استراتيجيات القيادة الأساسية للتنقل في الأوقات الصعبة.',
      category: 'القيادة',
      thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=225&fit=crop',
      duration: '18:20'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'تقنيات إدارة الضغط',
      description: 'طرق عملية لتقليل الضغط والحفاظ على وضوح الذهن.',
      category: 'العافية',
      thumbnail: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=225&fit=crop',
      duration: '10:15'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'استراتيجيات التحول المهني',
      description: 'كيفية التنقل بنجاح في تغييرات المهنة وإيجاد هدفك.',
      category: 'المهنة',
      thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=225&fit=crop',
      duration: '22:10'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'وضع الأهداف التي تعمل فعلاً',
      description: 'نهج منظم لوضع وتحقيق الأهداف المعنوية.',
      category: 'العقلية',
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=225&fit=crop',
      duration: '16:30'
    }
  ];

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'الكل' || video.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="categories" className="bg-slate-50 py-16 font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-slate-900 arabic-heading">الفئات المميزة</h2>
          <p className="text-slate-600 max-w-2xl mx-auto arabic-text">
            استكشف مجموعتنا المنسقة من فيديوهات التدريب المنظمة حسب الموضوع.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 arabic-text ${
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVideos.map((video, index) => (
            <VideoCard
              key={index}
              video={video}
              onSelect={() => onVideoSelect(video)}
            />
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
