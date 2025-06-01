
import { Play, Clock } from 'lucide-react';

interface VideoCardProps {
  video: {
    title: string;
    description: string;
    category: string;
    thumbnail: string;
    duration: string;
  };
  onSelect: () => void;
}

const VideoCard = ({ video, onSelect }: VideoCardProps) => {
  const getCategoryColor = (category: string) => {
    const colors = {
      'Mindset': 'bg-blue-100 text-blue-800',
      'Productivity': 'bg-green-100 text-green-800',
      'Leadership': 'bg-purple-100 text-purple-800',
      'Wellness': 'bg-pink-100 text-pink-800',
      'Career': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img 
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200">
            <Play size={16} className="text-blue-600 ml-0.5" />
          </div>
        </div>
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock size={12} />
          {video.duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
            {video.title}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${getCategoryColor(video.category)}`}>
            {video.category}
          </span>
        </div>
        
        <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
          {video.description}
        </p>
      </div>
    </div>
  );
};

export default VideoCard;
