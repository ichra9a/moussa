
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import FeaturedCourses from './course/FeaturedCourses';
import FeaturedModules from './course/FeaturedModules';
import { useCourseSubscription } from '@/hooks/useCourseSubscription';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_active: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  course_id: string;
  order_index: number;
  is_active: boolean;
  courses: {
    title: string;
    thumbnail: string;
  } | null;
}

const CourseSubscriptionSection = () => {
  const { student } = useAuth();
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [featuredModules, setFeaturedModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleQuickEnroll } = useCourseSubscription();

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  const fetchFeaturedContent = async () => {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          courses!fk_modules_course (
            id,
            title,
            description,
            thumbnail,
            is_active
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (coursesData) setFeaturedCourses(coursesData);
      if (modulesData && !modulesError) {
        const validModules = modulesData.filter(module => module.courses !== null);
        setFeaturedModules(validModules);
      }
    } catch (error) {
      console.error('Error fetching featured content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 shadow">
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id="courses" className="py-16 bg-gray-50 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 arabic-heading mb-4">
            ابدأ رحلتك التعليمية الآن
          </h2>
          <p className="text-xl text-slate-600 arabic-text max-w-3xl mx-auto">
            اختر من بين دوراتنا الشاملة أو مودولاتنا المتخصصة وابدأ التعلم فوراً
          </p>
        </div>

        <FeaturedCourses courses={featuredCourses} onEnroll={handleQuickEnroll} />
        <FeaturedModules modules={featuredModules} onEnroll={handleQuickEnroll} />

        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold arabic-heading mb-4">
              هل تريد المزيد من الخيارات؟
            </h3>
            <p className="text-lg arabic-text mb-6 opacity-90">
              استكشف جميع الدورات والمودولات المتاحة في لوحة التحكم
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                variant="secondary"
                className="arabic-text"
                onClick={() => navigate(student ? '/dashboard' : '/auth')}
              >
                {student ? 'انتقل إلى لوحة التحكم' : 'سجل دخولك الآن'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseSubscriptionSection;
