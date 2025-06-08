
import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import FeaturedCategories from '../components/FeaturedCategories';
import VideoModal from '../components/VideoModal';
import SearchSection from '../components/SearchSection';
import AboutSection from '../components/AboutSection';
import ContactSection from '../components/ContactSection';
import CourseSubscriptionSection from '../components/CourseSubscriptionSection';
import Footer from '../components/Footer';

const Index = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Ensure proper component initialization
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Don't render until properly loaded to prevent flash of old content
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 arabic-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white mobile-app">
      <Navigation />
      <Hero onVideoSelect={setSelectedVideo} />
      <SearchSection searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <CourseSubscriptionSection />
      <FeaturedCategories onVideoSelect={setSelectedVideo} searchQuery={searchQuery} />
      <AboutSection />
      <ContactSection />
      <Footer />
      
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
