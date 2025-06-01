
import { Play, Clock } from 'lucide-react';

interface VideoCardProps {
  video: {
    title: string;
    description: string;
    category: string;
    thumbnail: string;
    duration: string;
    youtube_url?: string;
    youtube_id?: string;
    views?: number;
  };
  onSelect: () => void;
}

const VideoCard = ({ video, onSelect }: VideoCardProps) => {
  const getCategoryColor = (category: string) => {
    const colors = {
      'العقلية والتطوير الذاتي': 'bg-blue-100 text-blue-800',
      'اللياقة البدنية والصحة': 'bg-green-100 text-green-800',
      'الإنتاجية والتنظيم': 'bg-purple-100 text-purple-800',
      'القيادة والأعمال': 'bg-pink-100 text-pink-800',
      'غير مصنف': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-smooth cursor-pointer group overflow-hidden font-cairo mobile-touch"
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img 
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-smooth"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-smooth flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-smooth">
            <Play size={16} className="text-blue-600 mr-0.5" />
          </div>
        </div>
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock size={12} />
          {video.duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4 text-right">
        <div className="flex items-start justify-between gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 arabic-text ${getCategoryColor(video.category)}`}>
            {video.category}
          </span>
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-smooth leading-tight arabic-text high-contrast">
            {video.title}
          </h3>
        </div>
        
        <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 arabic-text">
          {video.description}
        </p>

        {video.views !== undefined && (
          <div className="text-xs text-slate-500 arabic-text">
            {video.views} مشاهدة
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
