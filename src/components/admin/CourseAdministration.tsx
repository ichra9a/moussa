import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Users, BookOpen, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StudentManagement from './StudentManagement';
import NotificationManagement from './NotificationManagement';
import CourseList from './CourseList';
import CourseForm from './CourseForm';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_active: boolean;
}

interface Student {
  id: string;
  full_name: string;
  pin_code: string;
  email: string;
}

interface CourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  students: Student;
}

const CourseAdministration = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<string>('courses');
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
    fetchStudents();
    fetchEnrollments();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setCourses(data);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('full_name');
    
    if (data) setStudents(data);
  };

  const fetchEnrollments = async () => {
    const { data } = await supabase
      .from('student_enrollments')
      .select(`
        *,
        students!fk_student_enrollments_student (
          id,
          full_name,
          pin_code,
          email
        )
      `)
      .order('enrolled_at', { ascending: false });
    
    if (data) {
      const validEnrollments = data.filter(enrollment => enrollment.students !== null);
      setEnrollments(validEnrollments);
    }
  };

  const handleCreateCourse = async (courseData: { title: string; description: string; thumbnail: string }) => {
    if (!courseData.title.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الدورة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description,
          thumbnail: courseData.thumbnail || '/placeholder.svg',
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الدورة بنجاح"
      });

      setShowCreateCourse(false);
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الدورة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = async (courseData: { title: string; description: string; thumbnail: string }) => {
    if (!editingCourse || !courseData.title.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الدورة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: courseData.title,
          description: courseData.description,
          thumbnail: courseData.thumbnail || '/placeholder.svg',
        })
        .eq('id', editingCourse.id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تعديل الدورة بنجاح"
      });

      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعديل الدورة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟ سيتم حذف جميع المودولات والفيديوهات المرتبطة بها.')) return;

    setLoading(true);
    try {
      // First, delete related data
      const { error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .delete()
        .eq('course_id', courseId);

      if (enrollmentsError) throw enrollmentsError;

      // Get modules to delete their videos
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        
        // Delete module videos
        await supabase
          .from('module_videos')
          .delete()
          .in('module_id', moduleIds);

        // Delete modules
        await supabase
          .from('modules')
          .delete()
          .eq('course_id', courseId);
      }

      // Finally, delete the course
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف الدورة بنجاح"
      });

      fetchCourses();
      fetchEnrollments();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الدورة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedCourse || !selectedStudent) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الدورة والطالب",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: existingEnrollment } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', selectedStudent)
        .eq('course_id', selectedCourse)
        .single();

      if (existingEnrollment) {
        toast({
          title: "تنبيه",
          description: "الطالب مسجل بالفعل في هذه الدورة",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { error: enrollError } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: selectedStudent,
          course_id: selectedCourse
        });

      if (enrollError) throw enrollError;

      const selectedCourseData = courses.find(c => c.id === selectedCourse);
      const selectedStudentData = students.find(s => s.id === selectedStudent);

      if (selectedCourseData && selectedStudentData) {
        await supabase
          .from('notifications')
          .insert({
            student_id: selectedStudent,
            title: 'تم تسجيلك في دورة جديدة',
            message: `تم تسجيلك في دورة "${selectedCourseData.title}" بنجاح. يمكنك الآن الوصول إلى محتوى الدورة.`,
            type: 'success'
          });
      }

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الطالب في الدورة وإرسال إشعار له"
      });

      setSelectedCourse('');
      setSelectedStudent('');
      fetchEnrollments();
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الطالب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء تسجيل هذا الطالب؟')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('student_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إلغاء تسجيل الطالب من الدورة"
      });

      fetchEnrollments();
    } catch (error) {
      console.error('Error removing enrollment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء التسجيل",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-cairo" dir="rtl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses" className="arabic-text">الدورات</TabsTrigger>
          <TabsTrigger value="students" className="arabic-text">الطلاب</TabsTrigger>
          <TabsTrigger value="notifications" className="arabic-text">الإشعارات</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 arabic-heading">
                <BookOpen className="h-5 w-5" />
                إدارة الدورات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowCreateCourse(!showCreateCourse)}
                className="arabic-text"
              >
                <Plus className="ml-2 h-4 w-4" />
                إنشاء دورة جديدة
              </Button>

              {(showCreateCourse || editingCourse) && (
                <CourseForm
                  course={editingCourse}
                  onSubmit={editingCourse ? handleEditCourse : handleCreateCourse}
                  onCancel={() => {
                    setShowCreateCourse(false);
                    setEditingCourse(null);
                  }}
                  loading={loading}
                />
              )}

              <CourseList 
                courses={courses} 
                onEditCourse={(course) => {
                  setEditingCourse(course);
                  setShowCreateCourse(false);
                }}
                onDeleteCourse={handleDeleteCourse}
              />
            </CardContent>
          </Card>

          {/* Enroll Students Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 arabic-heading">
                <Users className="h-5 w-5" />
                تسجيل الطلاب في الدورات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="arabic-text">اختر الدورة</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="arabic-text">
                      <SelectValue placeholder="اختر دورة" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.filter(course => course.id && course.id.trim() !== '').map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="arabic-text">اختر الطالب</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="arabic-text">
                      <SelectValue placeholder="اختر طالب" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.pin_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleEnrollStudent} disabled={loading} className="arabic-text">
                <Users className="ml-2 h-4 w-4" />
                تسجيل الطالب في الدورة
              </Button>
            </CardContent>
          </Card>

          {/* Current Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle className="arabic-heading">التسجيلات الحالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollments.length === 0 ? (
                  <Alert>
                    <AlertDescription className="arabic-text">
                      لا توجد تسجيلات حالياً
                    </AlertDescription>
                  </Alert>
                ) : (
                  enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold arabic-text">{enrollment.students.full_name}</p>
                          <p className="text-sm text-gray-600 arabic-text">
                            PIN: {enrollment.students.pin_code}
                          </p>
                        </div>
                        <Badge variant="secondary" className="arabic-text">
                          {courses.find(c => c.id === enrollment.course_id)?.title || 'دورة غير معروفة'}
                        </Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveEnrollment(enrollment.id)}
                        disabled={loading}
                        className="arabic-text"
                      >
                        <X className="h-4 w-4" />
                        إلغاء التسجيل
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <StudentManagement />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseAdministration;
