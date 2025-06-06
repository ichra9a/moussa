
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Key, Trash2 } from 'lucide-react';

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
  const getStudentEnrollments = (studentId: string) => {
    return enrollments.filter(enrollment => enrollment.student_id === studentId);
  };

  if (students.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8 arabic-text">
        لم يتم العثور على طلاب
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {students.map(student => (
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
                onClick={() => onDeleteStudent(student.id)}
                className="arabic-text"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 ml-1" />
                حذف
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentList;
