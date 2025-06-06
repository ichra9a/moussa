
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, PlayCircle } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  course: {
    id: string;
    title: string;
  };
  module_videos: Array<{
    video: {
      id: string;
      title: string;
      duration_seconds: number;
      youtube_id: string;
      thumbnail?: string;
    };
  }>;
}

interface EnrolledCourseModulesProps {
  onVideoSelect: (video: any) => void;
}

const EnrolledCourseModules = ({ onVideoSelect }: EnrolledCourseModulesProps) => {
  const { student } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      fetchEnrolledModules();
    }
  }, [student]);

  const fetchEnrolledModules = async () => {
    if (!student) return;

    try {
      // Get enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_enrollments')
        .select('course_id')
        .eq('student_id', student.id)
        .eq('is_active', true);

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        setModules([]);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // Get modules for enrolled courses with explicit column naming
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          description,
          order_index,
          course_id,
          courses!modules_course_id_fkey(
            id,
            title
          ),
          module_videos(
            video:videos(
              id,
              title,
              duration_seconds,
              youtube_id,
              thumbnail
            )
          )
        `)
        .in('course_id', courseIds)
        .eq('is_active', true)
        .order('order_index');

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        return;
      }

      if (modulesData) {
        const formattedModules = modulesData.map(module => ({
          ...module,
          course: {
            id: module.courses?.id || '',
            title: module.courses?.title || ''
          }
        }));
        setModules(formattedModules);
      }
    } catch (error) {
      console.error('Error in fetchEnrolledModules:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">وحدات الدورات المسجل بها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">وحدات الدورات المسجل بها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 arabic-text">لم تسجل في أي دورات بعد</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 arabic-heading">
          <BookOpen className="h-5 w-5" />
          وحدات الدورات المسجل بها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules.map((module) => (
          <div key={module.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="arabic-text">
                    {module.course.title}
                  </Badge>
                  <Badge variant="outline" className="arabic-text">
                    الوحدة {module.order_index}
                  </Badge>
                </div>
                <h4 className="font-semibold arabic-text">{module.title}</h4>
                {module.description && (
                  <p className="text-sm text-gray-600 arabic-text mt-1">
                    {module.description}
                  </p>
                )}
              </div>
            </div>

            {module.module_videos && module.module_videos.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 arabic-text">
                  فيديوهات الوحدة ({module.module_videos.length})
                </h5>
                <div className="grid gap-2">
                  {module.module_videos.map((moduleVideo, index) => (
                    <div
                      key={moduleVideo.video.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <PlayCircle className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium arabic-text">
                            {moduleVideo.video.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(moduleVideo.video.duration_seconds || 0)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onVideoSelect({
                          id: moduleVideo.video.youtube_id,
                          title: moduleVideo.video.title,
                          thumbnail: moduleVideo.video.thumbnail || ''
                        })}
                        className="arabic-text"
                      >
                        مشاهدة
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EnrolledCourseModules;
