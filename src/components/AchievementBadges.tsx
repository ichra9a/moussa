
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Medal } from 'lucide-react';

interface Achievement {
  id: string;
  module_id: string;
  achievement_type: string;
  earned_at: string;
  modules: {
    title: string;
    courses: {
      title: string;
    };
  } | null;
}

const AchievementBadges = () => {
  const { student } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      fetchAchievements();
    }
  }, [student]);

  const fetchAchievements = async () => {
    if (!student) return;

    try {
      const { data, error } = await supabase
        .from('student_achievements')
        .select(`
          *,
          modules (
            title,
            courses!fk_modules_course (
              title
            )
          )
        `)
        .eq('student_id', student.id)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('Error fetching achievements:', error);
        setAchievements([]);
      } else if (data) {
        // Filter out any achievements where modules failed to load
        const validAchievements = data.filter(achievement => achievement.modules !== null);
        setAchievements(validAchievements);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'module_completion':
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 'course_completion':
        return <Award className="h-6 w-6 text-purple-500" />;
      case 'perfect_score':
        return <Star className="h-6 w-6 text-blue-500" />;
      default:
        return <Medal className="h-6 w-6 text-green-500" />;
    }
  };

  const getAchievementTitle = (type: string) => {
    switch (type) {
      case 'module_completion':
        return 'إتمام مودول';
      case 'course_completion':
        return 'إتمام دورة';
      case 'perfect_score':
        return 'درجة مثالية';
      default:
        return 'إنجاز';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">شارات الإنجاز</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 arabic-heading">
          <Trophy className="h-5 w-5 text-yellow-500" />
          شارات الإنجاز
          <Badge variant="secondary" className="arabic-text">
            {achievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  {getAchievementIcon(achievement.achievement_type)}
                  <div className="flex-1">
                    <h4 className="font-semibold arabic-text text-sm">
                      {getAchievementTitle(achievement.achievement_type)}
                    </h4>
                    <p className="text-sm text-gray-600 arabic-text">
                      {achievement.modules?.title || 'مودول غير متاح'}
                    </p>
                    <p className="text-xs text-gray-500 arabic-text">
                      من دورة: {achievement.modules?.courses?.title || 'دورة غير متاحة'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(achievement.earned_at).toLocaleDateString('ar')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 arabic-text">
              لم تحصل على أي شارات إنجاز بعد
            </p>
            <p className="text-sm text-gray-400 arabic-text">
              أكمل المودولات لتحصل على شارات الإنجاز
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementBadges;
