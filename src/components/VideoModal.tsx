
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface VideoModalProps {
  video: {
    id: string;
    title: string;
    description: string;
  };
  onClose: () => void;
}

const VideoModal = ({ video, onClose }: VideoModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 font-cairo">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors duration-200"
          >
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold text-slate-900 truncate pl-4 arabic-text text-right">
            {video.title}
          </h2>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Description */}
        <div className="p-6 text-right">
          <h3 className="font-semibold text-slate-900 mb-3 arabic-text">حول هذا الفيديو</h3>
          <p className="text-slate-600 leading-relaxed arabic-text">
            {video.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
