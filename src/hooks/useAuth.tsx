
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

interface AuthContextType {
  student: Student | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing student session in localStorage
    const checkStudentSession = () => {
      try {
        const storedStudent = localStorage.getItem('student');
        if (storedStudent) {
          const studentData = JSON.parse(storedStudent);
          setStudent(studentData);
        }
      } catch (error) {
        console.error('Error parsing student data:', error);
        localStorage.removeItem('student');
      }
      setLoading(false);
    };

    checkStudentSession();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('student');
    setStudent(null);
  };

  return (
    <AuthContext.Provider value={{ student, loading, signOut }}>
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
