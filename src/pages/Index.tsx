
import { useState } from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import FeaturedCategories from '../components/FeaturedCategories';
import VideoModal from '../components/VideoModal';
import SearchSection from '../components/SearchSection';
import AboutSection from '../components/AboutSection';
import ContactSection from '../components/ContactSection';

const Index = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white mobile-app">
      <Navigation />
      <Hero onVideoSelect={setSelectedVideo} />
      <SearchSection searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <FeaturedCategories onVideoSelect={setSelectedVideo} searchQuery={searchQuery} />
      <AboutSection />
      <ContactSection />
      
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
