
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, User, Mail, Phone } from 'lucide-react';
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

interface StudentListProps {
  students: Student[];
  enrollments: Enrollment[];
  onDeleteStudent: (studentId: string) => void;
  loading: boolean;
}

const StudentList = ({ students, enrollments, onDeleteStudent, loading }: StudentListProps) => {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const getStudentEnrollments = (studentId: string) => {
    return enrollments.filter(enrollment => enrollment.student_id === studentId);
  };

  const handleEditComplete = () => {
    setEditingStudent(null);
    window.location.reload(); // Refresh to show updated data
  };

  if (editingStudent) {
    return (
      <StudentForm
        student={editingStudent}
        onStudentCreated={handleEditComplete}
        onCancel={() => setEditingStudent(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 arabic-text">لا توجد طلاب مسجلين</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {students.map((student) => {
        const studentEnrollments = getStudentEnrollments(student.id);
        
        return (
          <Card key={student.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <h3 className="font-semibold arabic-text">{student.full_name}</h3>
                    <Badge variant="secondary" className="arabic-text">
                      {student.pin_code}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-3 w-3" />
                    <span>{student.email}</span>
                  </div>
                  
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  
                  {studentEnrollments.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 arabic-text mb-1">
                        الدورات المسجل بها:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {studentEnrollments.map((enrollment) => (
                          <Badge key={enrollment.id} variant="outline" className="text-xs">
                            {enrollment.course_title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    تاريخ التسجيل: {new Date(student.created_at).toLocaleDateString('ar')}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingStudent(student)}
                    className="arabic-text"
                  >
                    <Edit className="h-4 w-4" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteStudent(student.id)}
                    disabled={loading}
                    className="arabic-text"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentList;
