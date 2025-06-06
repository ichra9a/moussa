
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, BookOpen, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StudentManagement from './StudentManagement';
import ModuleManagement from './ModuleManagement';

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
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    thumbnail: ''
  });
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
        students (
          id,
          full_name,
          pin_code,
          email
        )
      `)
      .order('enrolled_at', { ascending: false });
    
    if (data) setEnrollments(data);
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
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
          title: newCourse.title,
          description: newCourse.description,
          thumbnail: newCourse.thumbnail || '/placeholder.svg',
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الدورة بنجاح"
      });

      setNewCourse({ title: '', description: '', thumbnail: '' });
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
      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: selectedStudent,
          course_id: selectedCourse
        });

      if (error && error.code === '23505') {
        toast({
          title: "تنبيه",
          description: "الطالب مسجل بالفعل في هذه الدورة",
          variant: "destructive"
        });
        return;
      }

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الطالب في الدورة بنجاح"
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
          <TabsTrigger value="modules" className="arabic-text">المودولات</TabsTrigger>
          <TabsTrigger value="students" className="arabic-text">الطلاب</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6 mt-6">
          {/* Create Course Section */}
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

              {showCreateCourse && (
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="arabic-text">عنوان الدورة</Label>
                      <Input
                        value={newCourse.title}
                        onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                        placeholder="أدخل عنوان الدورة"
                        className="arabic-text"
                      />
                    </div>
                    <div>
                      <Label className="arabic-text">رابط الصورة المصغرة</Label>
                      <Input
                        value={newCourse.thumbnail}
                        onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                        placeholder="رابط الصورة (اختياري)"
                        className="arabic-text"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="arabic-text">وصف الدورة</Label>
                    <Textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      placeholder="أدخل وصف الدورة"
                      className="arabic-text"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateCourse} disabled={loading} className="arabic-text">
                      <Save className="ml-2 h-4 w-4" />
                      حفظ الدورة
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateCourse(false)}
                      className="arabic-text"
                    >
                      <X className="ml-2 h-4 w-4" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}

              {/* Course List */}
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold text-lg arabic-heading">قائمة الدورات الحالية</h3>
                {courses.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 arabic-text">لا توجد دورات حالياً</p>
                ) : (
                  courses.map(course => (
                    <Card key={course.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {course.thumbnail && (
                          <div className="md:w-1/4 h-32 md:h-auto">
                            <img 
                              src={course.thumbnail} 
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 flex-1">
                          <h3 className="font-bold text-lg arabic-text">{course.title}</h3>
                          <p className="text-gray-600 arabic-text mt-1">{course.description}</p>
                          <Badge className="mt-2" variant={course.is_active ? "default" : "outline"}>
                            {course.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
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
                      {courses.map((course) => (
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

        <TabsContent value="modules" className="mt-6">
          <ModuleManagement courses={courses} />
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <StudentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseAdministration;
