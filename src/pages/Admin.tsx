
import { useState, useEffect } from 'react';
import AdminAuth from '@/components/admin/AdminAuth';
import AdminDashboard from '@/components/admin/AdminDashboard';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if admin auth is stored in localStorage
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = () => {
    localStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  if (!isAuthenticated) {
    return <AdminAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default Admin;
