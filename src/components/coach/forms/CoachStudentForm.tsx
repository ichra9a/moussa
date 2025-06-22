
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, BookOpen, Save, X } from 'lucide-react';

interface Student {
  id?: string;
  full_name: string;
  email: string;
  phone?: string;
  pin_code?: string;
}

interface Course {
  id: string;
  title: string;
}

interface CoachStudentFormProps {
  student?: Student | null;
  coachId: string;
  onStudentSaved: () => void;
  onCancel: () => void;
}

const CoachStudentForm = ({ student, coachId, onStudentSaved, onCancel }: CoachStudentFormProps) => {
  const [formData, setFormData] = useState<Student>({
    full_name: '',
    email: '',
    phone: '',
    pin_code: ''
  });
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        email: student.email || '',
        phone: student.phone || '',
        pin_code: student.pin_code || ''
      });
      fetchStudentEnrollments();
    }
    fetchCoachCourses();
  }, [student, coachId]);

  const fetchCoachCourses = async () => {
    try {
      const { data: coachCourses } = await supabase
        .from('coach_course_assignments')
        .select('course_id, courses(id, title)')
        .eq('coach_id', coachId)
        .eq('is_active', true);

      const courses = (coachCourses || [])
        .map(cc => cc.courses)
        .filter(course => course) as Course[];

      setAvailableCourses(courses);
    } catch (error) {
      console.error('Error fetching coach courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchStudentEnrollments = async () => {
    if (!student?.id) return;

    try {
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('course_id')
        .eq('student_id', student.id)
        .eq('is_active', true);

      setSelectedCourses((enrollments || []).map(e => e.course_id));
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
    }
  };

  const handleInputChange = (field: keyof Student, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCourseToggle = (courseId: string, checked: boolean) => {
    setSelectedCourses(prev => 
      checked 
        ? [...prev, courseId]
        : prev.filter(id => id !== courseId)
    );
  };

  const generatePinCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_unique_pin');
    
    if (error) {
      console.error('Error generating PIN:', error);
      return Math.random().toString().substr(2, 6);
    }
    
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let studentId = student?.id;

      if (student?.id) {
        // Update existing student
        const { error: updateError } = await supabase
          .from('students')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null
          })
          .eq('id', student.id);

        if (updateError) throw updateError;
      } else {
        // Create new student
        const pinCode = await generatePinCode();
        
        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            pin_code: pinCode
          })
          .select()
          .single();

        if (insertError) throw insertError;
        studentId = newStudent.id;
      }

      // Update course enrollments
      if (studentId) {
        // Remove old enrollments
        await supabase
          .from('student_enrollments')
          .delete()
          .eq('student_id', studentId);

        // Add new enrollments
        if (selectedCourses.length > 0) {
          const enrollments = selectedCourses.map(courseId => ({
            student_id: studentId,
            course_id: courseId
          }));

          const { error: enrollmentError } = await supabase
            .from('student_enrollments')
            .insert(enrollments);

          if (enrollmentError) throw enrollmentError;
        }
      }

      toast({
        title: "تم بنجاح",
        description: student?.id ? "تم تحديث الطالب بنجاح" : "تم إنشاء الطالب بنجاح"
      });

      onStudentSaved();
    } catch (error: any) {
      console.error('Error saving student:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ بيانات الطالب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="arabic-heading flex items-center gap-2">
          <User className="h-5 w-5" />
          {student?.id ? 'تعديل الطالب' : 'إضافة طالب جديد'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold arabic-heading">المعلومات الأساسية</h3>
            
            <div>
              <Label htmlFor="full_name" className="arabic-text">الاسم الكامل</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="أدخل الاسم الكامل"
                className="arabic-text"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="arabic-text">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="أدخل البريد الإلكتروني"
                className="arabic-text"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="arabic-text">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="أدخل رقم الهاتف (اختياري)"
                className="arabic-text"
              />
            </div>

            {student?.pin_code && (
              <div>
                <Label className="arabic-text">رمز PIN</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {student.pin_code}
                  </Badge>
                  <span className="text-sm text-gray-500 arabic-text">
                    (يستخدم للدخول إلى النظام)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Course Enrollments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold arabic-heading flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              الدورات المسجل بها
            </h3>
            
            {loadingCourses ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : availableCourses.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableCourses.map((course) => (
                  <div key={course.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`course-${course.id}`}
                      checked={selectedCourses.includes(course.id)}
                      onCheckedChange={(checked) => 
                        handleCourseToggle(course.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`course-${course.id}`} className="arabic-text flex-1">
                      {course.title}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 arabic-text text-center py-4">
                لا توجد دورات متاحة
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 arabic-text"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {student?.id ? 'تحديث الطالب' : 'إنشاء الطالب'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="arabic-text"
            >
              <X className="h-4 w-4 mr-2" />
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CoachStudentForm;
