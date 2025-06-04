
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  courses: Course;
}

const CourseSubscriptionSection = () => {
  const { student } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [featuredModules, setFeaturedModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  const fetchFeaturedContent = async () => {
    try {
      // Fetch featured courses (first 3 active courses)
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch featured modules (first 3 active modules)
      const { data: modulesData } = await supabase
        .from('modules')
        .select(`
          *,
          courses (
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
      if (modulesData) setFeaturedModules(modulesData);
    } catch (error) {
      console.error('Error fetching featured content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEnroll = async (courseId: string, type: 'course' | 'module') => {
    if (!student) {
      toast({
        title: "تسجيل مطلوب",
        description: "يجب تسجيل الدخول أولاً للاشتراك",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      if (type === 'course') {
        const { error } = await supabase
          .from('student_enrollments')
          .insert({
            student_id: student.id,
            course_id: courseId
          });

        if (error && error.code !== '23505') { // Ignore unique constraint violations
          throw error;
        }

        toast({
          title: "تم التسجيل بنجاح",
          description: "تم تسجيلك في الدورة بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('module_subscriptions')
          .insert({
            student_id: student.id,
            module_id: courseId
          });

        if (error && error.code !== '23505') { // Ignore unique constraint violations
          throw error;
        }

        toast({
          title: "تم الاشتراك بنجاح",
          description: "تم اشتراكك في المودول بنجاح",
        });
      }

      // Redirect to dashboard to see the new enrollment
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التسجيل",
        variant: "destructive"
      });
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

        {/* Featured Courses */}
        {featuredCourses.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-slate-900 arabic-heading flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                الدورات المميزة
              </h3>
              <Badge variant="secondary" className="arabic-text">
                تعلم شامل
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="relative">
                      <img 
                        src={course.thumbnail || '/placeholder.svg'} 
                        alt={course.title}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                      <Badge className="absolute top-2 right-2 bg-blue-600">
                        دورة كاملة
                      </Badge>
                    </div>
                    <CardTitle className="arabic-heading text-xl text-slate-900">
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 arabic-text line-clamp-3">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span className="arabic-text">متعدد المستويات</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} />
                        <span className="arabic-text">تقدم مستمر</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 arabic-text shadow-lg"
                      onClick={() => handleQuickEnroll(course.id, 'course')}
                    >
                      اشترك في الدورة
                      <Play size={18} className="mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Featured Modules */}
        {featuredModules.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-slate-900 arabic-heading flex items-center gap-2">
                <Play className="h-6 w-6 text-green-600" />
                المودولات المتخصصة
              </h3>
              <Badge variant="secondary" className="arabic-text">
                تعلم سريع
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredModules.map((module) => (
                <Card key={module.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="relative">
                      <img 
                        src={module.courses.thumbnail || '/placeholder.svg'} 
                        alt={module.title}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                      <Badge className="absolute top-2 right-2 bg-green-600">
                        مودول مفرد
                      </Badge>
                    </div>
                    <CardTitle className="arabic-heading text-xl text-slate-900">
                      {module.title}
                    </CardTitle>
                    <p className="text-sm text-slate-500 arabic-text">
                      من دورة: {module.courses.title}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 arabic-text line-clamp-3">
                      {module.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <BookOpen size={14} />
                        <span className="arabic-text">تعلم مركز</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} />
                        <span className="arabic-text">نتائج سريعة</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 arabic-text shadow-lg"
                      onClick={() => handleQuickEnroll(module.id, 'module')}
                    >
                      اشترك في المودول
                      <BookOpen size={18} className="mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
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
