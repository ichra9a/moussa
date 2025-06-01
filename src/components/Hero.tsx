
import { Play } from 'lucide-react';

interface HeroProps {
  onVideoSelect: (video: any) => void;
}

const Hero = ({ onVideoSelect }: HeroProps) => {
  const featuredVideo = {
    id: 'dQw4w9WgXcQ',
    title: 'Welcome to Your Transformation Journey',
    description: 'Discover how to unlock your potential and achieve your goals with proven coaching strategies.',
    thumbnail: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'
  };

  return (
    <section id="home" className="relative bg-gradient-to-br from-slate-50 to-slate-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Transform Your
                <span className="block text-blue-600">Potential</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                Professional coaching content designed to help you overcome challenges, 
                build confidence, and achieve your personal and professional goals.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onVideoSelect(featuredVideo)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Play size={20} />
                Watch Introduction
              </button>
              <button className="border border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors duration-200">
                Explore Categories
              </button>
            </div>

            <div className="flex items-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">50+</span>
                <span>Video Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">10+</span>
                <span>Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">1000+</span>
                <span>Students</span>
              </div>
            </div>
          </div>

          {/* Featured Video Thumbnail */}
          <div className="relative">
            <div 
              className="relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
              onClick={() => onVideoSelect(featuredVideo)}
            >
              <img 
                src={featuredVideo.thumbnail}
                alt={featuredVideo.title}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Play size={24} className="text-blue-600 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
