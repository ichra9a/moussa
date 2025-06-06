
import { useState, useEffect, createContext, useContext } from 'react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  pin_code: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface Coach {
  id: string;
  full_name: string;
  pin_code: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  student: Student | null;
  coach: Coach | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const checkSession = () => {
      try {
        const storedStudent = localStorage.getItem('student');
        const storedCoach = localStorage.getItem('coach');
        
        if (storedStudent) {
          const studentData = JSON.parse(storedStudent);
          setStudent(studentData);
        }
        
        if (storedCoach) {
          const coachData = JSON.parse(storedCoach);
          setCoach(coachData);
        }
      } catch (error) {
        console.error('Error parsing session data:', error);
        localStorage.removeItem('student');
        localStorage.removeItem('coach');
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes (when user logs in without page refresh)
    const handleStudentAuthChange = () => {
      try {
        const storedStudent = localStorage.getItem('student');
        if (storedStudent) {
          const studentData = JSON.parse(storedStudent);
          setStudent(studentData);
        }
      } catch (error) {
        console.error('Error parsing student data:', error);
      }
    };

    const handleCoachAuthChange = () => {
      try {
        const storedCoach = localStorage.getItem('coach');
        if (storedCoach) {
          const coachData = JSON.parse(storedCoach);
          setCoach(coachData);
        }
      } catch (error) {
        console.error('Error parsing coach data:', error);
      }
    };

    window.addEventListener('student-auth-changed', handleStudentAuthChange);
    window.addEventListener('coach-auth-changed', handleCoachAuthChange);

    return () => {
      window.removeEventListener('student-auth-changed', handleStudentAuthChange);
      window.removeEventListener('coach-auth-changed', handleCoachAuthChange);
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem('student');
    localStorage.removeItem('coach');
    setStudent(null);
    setCoach(null);
  };

  return (
    <AuthContext.Provider value={{ student, coach, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
