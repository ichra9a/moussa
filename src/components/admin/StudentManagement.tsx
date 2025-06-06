
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Users, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StudentForm from './StudentForm';
import StudentList from './StudentList';

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  pin_code: string;
  created_at: string;
}

interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  course_title: string;
}

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchEnrollments();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setStudents(data);
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

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student_id,
          course_id,
          courses!fk_student_enrollments_course (
            title
          )
        `);

      if (error) throw error;
      
      if (data) {
        const validEnrollments = data.filter(enrollment => enrollment.courses !== null);
        setEnrollments(validEnrollments.map(enrollment => ({
          id: enrollment.id,
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          course_title: enrollment.courses?.title || 'دورة غير متاحة'
        })));
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف الطالب بنجاح"
      });

      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الطالب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.pin_code.includes(searchQuery)
  );

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      {showAddStudent ? (
        <StudentForm
          onStudentCreated={() => {
            setShowAddStudent(false);
            fetchStudents();
          }}
          onCancel={() => setShowAddStudent(false)}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between arabic-heading">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                إدارة الطلاب
              </span>
              <Button 
                onClick={() => setShowAddStudent(true)}
                className="arabic-text"
              >
                <Plus className="ml-2 h-4 w-4" />
                إضافة طالب جديد
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-3 pr-10 arabic-text"
                placeholder="بحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <StudentList
              students={filteredStudents}
              enrollments={enrollments}
              onDeleteStudent={handleDeleteStudent}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentManagement;
