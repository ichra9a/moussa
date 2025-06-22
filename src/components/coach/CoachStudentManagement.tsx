
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, User, Mail, Calendar, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  enrollments: {
    course_title: string;
    enrolled_at: string;
    progress: number;
  }[];
}

const CoachStudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('Fetching students with enrollments...');

      // Fetch students first
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // Fetch enrollments with course details for each student
      const studentsWithEnrollments = await Promise.all(
        (studentsData || []).map(async (student) => {
          // First get enrollments for this student
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('student_enrollments')
            .select('enrolled_at, course_id')
            .eq('student_id', student.id)
            .eq('is_active', true);

          if (enrollmentsError) {
            console.error('Error fetching enrollments:', enrollmentsError);
            return {
              ...student,
              enrollments: []
            };
          }

          // Then get course details for each enrollment
          const enrollmentsWithCourses = await Promise.all(
            (enrollments || []).map(async (enrollment) => {
              const { data: course, error: courseError } = await supabase
                .from('courses')
                .select('title')
                .eq('id', enrollment.course_id)
                .single();

              if (courseError) {
                console.error('Error fetching course:', courseError);
                return {
                  course_title: 'دورة غير متاحة',
                  enrolled_at: enrollment.enrolled_at,
                  progress: 0
                };
              }

              return {
                course_title: course?.title || 'دورة غير متاحة',
                enrolled_at: enrollment.enrolled_at,
                progress: Math.floor(Math.random() * 100) // Placeholder - implement real progress calculation
              };
            })
          );

          return {
            ...student,
            enrollments: enrollmentsWithCourses
          };
        })
      );

      setStudents(studentsWithEnrollments);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات الطلاب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <h2 className="text-2xl font-bold text-gray-900 arabic-heading">إدارة الطلاب</h2>
        <Badge variant="outline" className="arabic-text">
          {filteredStudents.length} طالب
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          className="pl-3 pr-10 arabic-text"
          placeholder="البحث عن طالب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg arabic-text">{student.full_name}</CardTitle>
                </div>
                <Badge className="arabic-text">
                  {student.enrollments.length} دورة
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="arabic-text">{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="arabic-text">انضم في: {formatDate(student.created_at)}</span>
                </div>
              </div>

              {student.enrollments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 arabic-text flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    الدورات المسجل بها:
                  </h4>
                  {student.enrollments.map((enrollment, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium arabic-text">{enrollment.course_title}</span>
                        <span className="text-sm text-gray-500 arabic-text">
                          {enrollment.progress}%
                        </span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1 arabic-text">
                        تاريخ التسجيل: {formatDate(enrollment.enrolled_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredStudents.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2 arabic-text">
                لا توجد نتائج
              </h3>
              <p className="text-gray-500 arabic-text">
                لم يتم العثور على طلاب مطابقين لبحثك
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CoachStudentManagement;
