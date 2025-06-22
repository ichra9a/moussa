
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Calendar, Users, Clock, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  due_date: string | null;
  max_score: number;
  is_active: boolean;
  created_at: string;
  course_title?: string;
  submissions_count: number;
}

interface Course {
  id: string;
  title: string;
}

const CoachAssignmentManagement = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    instructions: '',
    course_id: '',
    due_date: '',
    max_score: 100
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          courses (
            title
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch courses for the dropdown
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (coursesError) throw coursesError;

      // Enhanced assignments with submission counts
      const assignmentsWithStats = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { count: submissionsCount } = await supabase
            .from('assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', assignment.id);

          return {
            ...assignment,
            course_title: assignment.courses?.title,
            submissions_count: submissionsCount || 0
          };
        })
      );

      setAssignments(assignmentsWithStats);
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      if (!newAssignment.title || !newAssignment.course_id) {
        toast({
          title: "خطأ",
          description: "يرجى ملء العنوان واختيار الدورة",
          variant: "destructive"
        });
        return;
      }

      const assignmentData = {
        title: newAssignment.title,
        description: newAssignment.description,
        instructions: newAssignment.instructions,
        course_id: newAssignment.course_id,
        due_date: newAssignment.due_date || null,
        max_score: newAssignment.max_score,
        is_active: true
      };

      const { error } = await supabase
        .from('assignments')
        .insert([assignmentData]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الواجب بنجاح"
      });

      setShowCreateDialog(false);
      setNewAssignment({
        title: '',
        description: '',
        instructions: '',
        course_id: '',
        due_date: '',
        max_score: 100
      });
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الواجب",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (!assignment.due_date) {
      return <Badge variant="secondary" className="arabic-text">بدون موعد نهائي</Badge>;
    }
    
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    
    if (dueDate < now) {
      return <Badge variant="destructive" className="arabic-text">منتهي الصلاحية</Badge>;
    } else {
      return <Badge variant="default" className="arabic-text">نشط</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 arabic-heading">إدارة الواجبات</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="arabic-text">
              <Plus className="ml-2 h-4 w-4" />
              إنشاء واجب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl font-cairo" dir="rtl">
            <DialogHeader>
              <DialogTitle className="arabic-heading">إنشاء واجب جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 arabic-text">عنوان الواجب</label>
                <Input
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  placeholder="أدخل عنوان الواجب"
                  className="arabic-text"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 arabic-text">الدورة</label>
                <Select
                  value={newAssignment.course_id}
                  onValueChange={(value) => setNewAssignment({...newAssignment, course_id: value})}
                >
                  <SelectTrigger className="arabic-text">
                    <SelectValue placeholder="اختر الدورة" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 arabic-text">الوصف</label>
                <Textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  placeholder="وصف الواجب"
                  className="arabic-text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 arabic-text">التعليمات</label>
                <Textarea
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment({...newAssignment, instructions: e.target.value})}
                  placeholder="تعليمات تنفيذ الواجب"
                  className="arabic-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 arabic-text">تاريخ التسليم</label>
                  <Input
                    type="datetime-local"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 arabic-text">الدرجة القصوى</label>
                  <Input
                    type="number"
                    value={newAssignment.max_score}
                    onChange={(e) => setNewAssignment({...newAssignment, max_score: parseInt(e.target.value) || 100})}
                    className="arabic-text"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateAssignment} className="arabic-text">
                  إنشاء الواجب
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="arabic-text">
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length > 0 ? (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg arabic-text">{assignment.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="arabic-text">{assignment.course_title}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(assignment.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(assignment)}
                    <Badge variant="outline" className="arabic-text">
                      <Users className="h-3 w-3 ml-1" />
                      {assignment.submissions_count} تسليم
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignment.description && (
                  <p className="text-gray-600 arabic-text">{assignment.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="arabic-text">الدرجة القصوى: {assignment.max_score}</span>
                    {assignment.due_date && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span className="arabic-text">موعد التسليم: {formatDate(assignment.due_date)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="arabic-text">
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button variant="outline" size="sm" className="arabic-text">
                      <FileText className="h-4 w-4 ml-1" />
                      عرض التسليمات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2 arabic-text">
              لا توجد واجبات
            </h3>
            <p className="text-gray-500 arabic-text">
              ابدأ بإنشاء واجب جديد للطلاب
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachAssignmentManagement;
