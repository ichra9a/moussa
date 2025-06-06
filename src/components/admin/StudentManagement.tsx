
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Users, Mail, Phone, Search, Key, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StudentForm from './StudentForm';

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
          courses (
            title
          )
        `);

      if (error) throw error;
      
      if (data) {
        setEnrollments(data.map(enrollment => ({
          id: enrollment.id,
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          course_title: enrollment.courses.title
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

  const getStudentEnrollments = (studentId: string) => {
    return enrollments.filter(enrollment => enrollment.student_id === studentId);
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
            
            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-8 arabic-text">
                  {searchQuery ? 'لا توجد نتائج للبحث' : 'لم يتم العثور على طلاب'}
                </p>
              ) : (
                filteredStudents.map(student => (
                  <div key={student.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between gap-3">
                      <div>
                        <h3 className="font-semibold arabic-text text-lg">{student.full_name}</h3>
                        <div className="flex flex-col sm:flex-row gap-3 mt-2 text-gray-600 text-sm">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {student.email}
                          </span>
                          {student.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {student.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono">
                            <Key className="h-4 w-4" />
                            PIN: {student.pin_code}
                          </span>
                        </div>
                        
                        {/* Student Enrollments */}
                        <div className="mt-3">
                          <p className="text-sm text-gray-500 mb-1 arabic-text">الدورات المسجل فيها:</p>
                          <div className="flex flex-wrap gap-2">
                            {getStudentEnrollments(student.id).length > 0 ? (
                              getStudentEnrollments(student.id).map(enrollment => (
                                <Badge key={enrollment.id} variant="outline">
                                  {enrollment.course_title}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400 arabic-text">لا توجد دورات</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="self-start">
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id)}
                          className="arabic-text"
                        >
                          <Trash2 className="h-4 w-4 ml-1" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentManagement;
