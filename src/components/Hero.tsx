
import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
interface HeroProps {
  onVideoSelect: (video: any) => void;
}
const Hero = ({
  onVideoSelect
}: HeroProps) => {
  const [content, setContent] = useState({
    title: 'طوّر من إمكاناتك',
    subtitle: 'محتوى تدريبي احترافي مصمم لمساعدتك على تجاوز التحديات، بناء الثقة، وتحقيق أهدافك الشخصية والمهنية.',
    videoTitle: 'مرحباً بكم في رحلة التطوير الشخصي',
    videoDescription: 'اكتشف كيفية إطلاق إمكاناتك وتحقيق أهدافك من خلال استراتيجيات التدريب المؤكدة.',
    videoId: 'dQw4w9WgXcQ',
    videoThumbnail: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop',
    primaryButton: 'شاهد المقدمة',
    secondaryButton: 'استكشف الفئات',
    stats: {
      videos: '50+',
      videosLabel: 'درس فيديو',
      categories: '10+',
      categoriesLabel: 'فئة',
      students: '1000+',
      studentsLabel: 'طالب'
    }
  });
  useEffect(() => {
    fetchContent();
  }, []);
  const fetchContent = async () => {
    try {
      const {
        data
      } = await supabase.from('website_settings').select('setting_key, setting_value').in('setting_key', ['hero_title', 'hero_subtitle', 'hero_video_title', 'hero_video_description', 'hero_video_id', 'hero_video_thumbnail', 'hero_primary_button', 'hero_secondary_button', 'stats_videos', 'stats_videos_label', 'stats_categories', 'stats_categories_label', 'stats_students', 'stats_students_label']);
      if (data) {
        const settings: Record<string, any> = {};
        data.forEach((setting: any) => {
          // Extract the actual value - it could be nested in a value property
          const value = setting.setting_value?.value || setting.setting_value;
          settings[setting.setting_key] = typeof value === 'string' ? value : String(value || '');
        });
        setContent({
          title: settings.hero_title || content.title,
          subtitle: settings.hero_subtitle || content.subtitle,
          videoTitle: settings.hero_video_title || content.videoTitle,
          videoDescription: settings.hero_video_description || content.videoDescription,
          videoId: settings.hero_video_id || content.videoId,
          videoThumbnail: settings.hero_video_thumbnail || content.videoThumbnail,
          primaryButton: settings.hero_primary_button || content.primaryButton,
          secondaryButton: settings.hero_secondary_button || content.secondaryButton,
          stats: {
            videos: settings.stats_videos || content.stats.videos,
            videosLabel: settings.stats_videos_label || content.stats.videosLabel,
            categories: settings.stats_categories || content.stats.categories,
            categoriesLabel: settings.stats_categories_label || content.stats.categoriesLabel,
            students: settings.stats_students || content.stats.students,
            studentsLabel: settings.stats_students_label || content.stats.studentsLabel
          }
        });
      }
    } catch (error) {
      console.error('Error fetching hero content:', error);
    }
  };
  const featuredVideo = {
    id: content.videoId,
    title: content.videoTitle,
    description: content.videoDescription,
    thumbnail: content.videoThumbnail
  };

  // Safely handle the title splitting - ensure it's a string
  const titleText = String(content.title || 'طوّر من إمكاناتك');
  const titleWords = titleText.split(' ');
  const mainTitle = titleWords.slice(0, -1).join(' ');
  const highlightedWord = titleWords.slice(-1)[0] || '';
  return <section id="home" className="relative bg-gradient-to-br from-slate-50 to-slate-100 py-20 font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8 text-right">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight arabic-heading text-justify py-0 my-0 mx-0 lg:text-8xl">
                {mainTitle}
                <span className="block text-blue-600">{highlightedWord}</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed arabic-text">
                {content.subtitle}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => onVideoSelect(featuredVideo)} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 arabic-text">
                <Play size={20} />
                {content.primaryButton}
              </button>
              <button className="border border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors duration-200 arabic-text">
                {content.secondaryButton}
              </button>
            </div>

            <div className="flex items-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{content.stats.videos}</span>
                <span className="arabic-text">{content.stats.videosLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{content.stats.categories}</span>
                <span className="arabic-text">{content.stats.categoriesLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{content.stats.students}</span>
                <span className="arabic-text">{content.stats.studentsLabel}</span>
              </div>
            </div>
          </div>

          {/* Featured Video Thumbnail */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer group" onClick={() => onVideoSelect(featuredVideo)}>
              <img src={featuredVideo.thumbnail} alt={featuredVideo.title} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Play size={24} className="text-blue-600 mr-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;
