
import { useState } from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import FeaturedCategories from '../components/FeaturedCategories';
import VideoModal from '../components/VideoModal';
import SearchSection from '../components/SearchSection';

const Index = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero onVideoSelect={setSelectedVideo} />
      <SearchSection searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <FeaturedCategories onVideoSelect={setSelectedVideo} searchQuery={searchQuery} />
      
      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
};

export default Index;
