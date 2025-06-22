
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Search, Edit, Trash2, Users, Clock } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  max_score: number;
  is_active: boolean;
  created_at: string;
  course_id?: string;
  course_title?: string;
  submission_count?: number;
  avg_score?: number;
}

interface CoachAssignmentManagementProps {
  onAddAssignment: () => void;
  onEditAssignment: (assignment: Assignment) => void;
}

const CoachAssignmentManagement = ({ onAddAssignment, onEditAssignment }: CoachAssignmentManagementProps) => {
  const { coach } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (coach) {
      fetchAssignments();
    }
  }, [coach]);

  const fetchAssignments = async () => {
    if (!coach) return;

    try {
      setLoading(true);

      // Get coach's courses first
      const { data: coachCourses } = await supabase
        .from('coach_course_assignments')
        .select('course_id')
        .eq('coach_id', coach.id)
        .eq('is_active', true);

      const courseIds = coachCourses?.map(cc => cc.course_id) || [];

      if (courseIds.length === 0) {
        setAssignments([]);
        return;
      }

      // Get assignments for coach's courses
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          instructions,
          max_score,
          is_active,
          created_at,
          course_id,
          courses (title)
        `)
        .in('course_id', courseIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (assignmentsData) {
        const assignmentsWithStats = await Promise.all(
          assignmentsData.map(async (assignment) => {
            // Get submission count
            const { count: submissionCount } = await supabase
              .from('assignment_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('assignment_id', assignment.id);

            // Get average score
            const { data: submissions } = await supabase
              .from('assignment_submissions')
              .select('score')
              .eq('assignment_id', assignment.id)
              .not('score', 'is', null);

            const avgScore = submissions && submissions.length > 0
              ? Math.round(submissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / submissions.length)
              : 0;

            return {
              ...assignment,
              course_title: (assignment.courses as any)?.title,
              submission_count: submissionCount || 0,
              avg_score: avgScore
            };
          })
        );

        setAssignments(assignmentsWithStats);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الواجبات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;

    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الواجب بنجاح"
      });

      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الواجب",
        variant: "destructive"
      });
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold arabic-heading">إدارة الواجبات</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold arabic-heading">إدارة الواجبات</h2>
        <Button onClick={onAddAssignment} className="arabic-text">
          <Plus className="h-4 w-4 mr-2" />
          إضافة واجب جديد
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في الواجبات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 arabic-text"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">إجمالي الواجبات</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">إجمالي التسليمات</p>
                <p className="text-2xl font-bold">
                  {assignments.reduce((sum, assignment) => sum + (assignment.submission_count || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 arabic-text">متوسط الدرجات</p>
                <p className="text-2xl font-bold">
                  {assignments.length > 0 
                    ? Math.round(assignments.reduce((sum, a) => sum + (a.avg_score || 0), 0) / assignments.length)
                    : 0}%
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="arabic-heading text-lg">{assignment.title}</CardTitle>
                <Badge variant={assignment.is_active ? "default" : "secondary"}>
                  {assignment.is_active ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
              {assignment.course_title && (
                <p className="text-sm text-blue-600 arabic-text">{assignment.course_title}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {assignment.description && (
                <p className="text-sm text-gray-600 arabic-text line-clamp-2">
                  {assignment.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 arabic-text">الدرجة النهائية:</span>
                  <p className="font-semibold">{assignment.max_score}</p>
                </div>
                <div>
                  <span className="text-gray-500 arabic-text">التسليمات:</span>
                  <p className="font-semibold">{assignment.submission_count}</p>
                </div>
                <div>
                  <span className="text-gray-500 arabic-text">متوسط الدرجات:</span>
                  <p className="font-semibold">{assignment.avg_score}%</p>
                </div>
                <div>
                  <span className="text-gray-500 arabic-text">تاريخ الإنشاء:</span>
                  <p className="font-semibold">
                    {new Date(assignment.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditAssignment(assignment)}
                  className="flex-1 arabic-text"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteAssignment(assignment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssignments.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 arabic-heading mb-2">
              لا توجد واجبات
            </h3>
            <p className="text-gray-500 arabic-text mb-4">
              {searchTerm ? 'لم يتم العثور على واجبات تطابق البحث' : 'لم يتم إنشاء أي واجبات بعد'}
            </p>
            {!searchTerm && (
              <Button onClick={onAddAssignment} className="arabic-text">
                <Plus className="h-4 w-4 mr-2" />
                إضافة واجب جديد
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachAssignmentManagement;
