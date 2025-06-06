
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Save, X, Calendar as CalendarIcon, FileText, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string;
  title: string;
  description: string;
  course_id: string;
  module_id: string | null;
  due_date: string | null;
  instructions: string;
  max_score: number;
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
}

interface AssignmentManagementProps {
  courses: Course[];
}

const AssignmentManagement = ({ courses }: AssignmentManagementProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    course_id: '',
    module_id: '',
    due_date: null as Date | null,
    instructions: '',
    max_score: 100
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
    fetchModules();
  }, [selectedCourse]);

  const fetchAssignments = async () => {
    const query = supabase.from('assignments').select('*').order('created_at', { ascending: false });
    
    if (selectedCourse && selectedCourse !== 'all') {
      query.eq('course_id', selectedCourse);
    }
    
    const { data } = await query;
    if (data) setAssignments(data);
  };

  const fetchModules = async () => {
    const { data } = await supabase.from('modules').select('*').order('order_index');
    if (data) setModules(data);
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title.trim() || !newAssignment.course_id) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الواجب واختيار الدورة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          title: newAssignment.title,
          description: newAssignment.description,
          course_id: newAssignment.course_id,
          module_id: newAssignment.module_id || null,
          due_date: newAssignment.due_date?.toISOString() || null,
          instructions: newAssignment.instructions,
          max_score: newAssignment.max_score
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الواجب بنجاح"
      });

      setNewAssignment({
        title: '',
        description: '',
        course_id: '',
        module_id: '',
        due_date: null,
        instructions: '',
        max_score: 100
      });
      setShowCreateForm(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الواجب",
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
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
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

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || 'غير محدد';
  };

  const getModuleTitle = (moduleId: string) => {
    return modules.find(m => m.id === moduleId)?.title || '';
  };

  const getFilteredModules = (courseId: string) => {
    return modules.filter(m => m.course_id === courseId);
  };

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      {/* Course Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">تصفية حسب الدورة</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="arabic-text">
              <SelectValue placeholder="اختر دورة لعرض واجباتها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الدورات</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Create Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-heading">
            <FileText className="h-5 w-5" />
            إدارة الواجبات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="arabic-text"
          >
            <Plus className="ml-2 h-4 w-4" />
            إنشاء واجب جديد
          </Button>

          {showCreateForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="arabic-text">عنوان الواجب</Label>
                  <Input
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    placeholder="أدخل عنوان الواجب"
                    className="arabic-text"
                  />
                </div>
                <div>
                  <Label className="arabic-text">الدورة</Label>
                  <Select 
                    value={newAssignment.course_id} 
                    onValueChange={(value) => setNewAssignment({ ...newAssignment, course_id: value, module_id: '' })}
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
                  <Label className="arabic-text">المودول (اختياري)</Label>
                  <Select 
                    value={newAssignment.module_id} 
                    onValueChange={(value) => setNewAssignment({ ...newAssignment, module_id: value })}
                  >
                    <SelectTrigger className="arabic-text">
                      <SelectValue placeholder="اختر المودول" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون مودول</SelectItem>
                      {getFilteredModules(newAssignment.course_id).map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="arabic-text">الدرجة الكاملة</Label>
                  <Input
                    type="number"
                    value={newAssignment.max_score}
                    onChange={(e) => setNewAssignment({ ...newAssignment, max_score: parseInt(e.target.value) || 100 })}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
              <div>
                <Label className="arabic-text">وصف الواجب</Label>
                <Textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="أدخل وصف الواجب"
                  className="arabic-text"
                  rows={3}
                />
              </div>
              <div>
                <Label className="arabic-text">تعليمات الواجب</Label>
                <Textarea
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                  placeholder="أدخل تعليمات مفصلة للواجب"
                  className="arabic-text"
                  rows={4}
                />
              </div>
              <div>
                <Label className="arabic-text">موعد التسليم</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal arabic-text",
                        !newAssignment.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newAssignment.due_date ? format(newAssignment.due_date, "PPP") : "اختر موعد التسليم"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newAssignment.due_date || undefined}
                      onSelect={(date) => setNewAssignment({ ...newAssignment, due_date: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateAssignment} disabled={loading} className="arabic-text">
                  <Save className="ml-2 h-4 w-4" />
                  حفظ الواجب
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  className="arabic-text"
                >
                  <X className="ml-2 h-4 w-4" />
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">الواجبات الموجودة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <p className="text-gray-500 arabic-text text-center py-4">
                لا توجد واجبات {selectedCourse && selectedCourse !== 'all' ? 'في هذه الدورة' : ''}
              </p>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold arabic-text">{assignment.title}</h3>
                      <p className="text-sm text-gray-600 arabic-text">{assignment.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="arabic-text">
                          {getCourseTitle(assignment.course_id)}
                        </Badge>
                        {assignment.module_id && (
                          <Badge variant="secondary" className="arabic-text">
                            {getModuleTitle(assignment.module_id)}
                          </Badge>
                        )}
                        <Badge variant={assignment.is_active ? "default" : "secondary"}>
                          {assignment.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                      {assignment.due_date && (
                        <p className="text-sm text-orange-600 arabic-text mt-1">
                          موعد التسليم: {format(new Date(assignment.due_date), "PPP")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="arabic-text"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentManagement;
