
import { useState } from 'react';
import { Menu, X, Settings, User, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { student, signOut } = useAuth();

  const navLinks = [
    { name: 'الرئيسية', href: '#home' },
    { name: 'الفئات', href: '#categories' },
    { name: 'من نحن', href: '#about' },
    { name: 'تواصل معنا', href: '#contact' }
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 font-cairo mobile-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-slate-800 arabic-heading high-contrast">منصة التدريب</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="mr-10 flex items-baseline space-x-reverse space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-smooth arabic-text focus-enhanced"
                >
                  {link.name}
                </a>
              ))}
              
              {student ? (
                <>
                  <a
                    href="/dashboard"
                    className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-smooth arabic-text focus-enhanced flex items-center gap-1"
                  >
                    <User size={16} />
                    لوحة الطالب
                  </a>
                  <Button
                    onClick={signOut}
                    variant="ghost"
                    className="text-slate-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-smooth arabic-text"
                  >
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <a
                  href="/auth"
                  className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-smooth arabic-text focus-enhanced flex items-center gap-1"
                >
                  <LogIn size={16} />
                  تسجيل الدخول
                </a>
              )}
              
              <a
                href="/admin"
                className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-smooth arabic-text focus-enhanced flex items-center gap-1"
              >
                <Settings size={16} />
                الإدارة
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2 mobile-touch transition-smooth"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-slate-600 hover:text-slate-900 block px-3 py-2 text-base font-medium arabic-text mobile-touch transition-smooth"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              
              {student ? (
                <>
                  <a
                    href="/dashboard"
                    className="text-slate-600 hover:text-blue-600 block px-3 py-2 text-base font-medium arabic-text mobile-touch transition-smooth flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={16} />
                    لوحة الطالب
                  </a>
                  <Button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    variant="ghost"
                    className="text-slate-600 hover:text-red-600 block px-3 py-2 text-base font-medium arabic-text mobile-touch transition-smooth w-full text-right"
                  >
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <a
                  href="/auth"
                  className="text-slate-600 hover:text-blue-600 block px-3 py-2 text-base font-medium arabic-text mobile-touch transition-smooth flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn size={16} />
                  تسجيل الدخول
                </a>
              )}
              
              <a
                href="/admin"
                className="text-slate-600 hover:text-blue-600 block px-3 py-2 text-base font-medium arabic-text mobile-touch transition-smooth flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings size={16} />
                لوحة الإدارة
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
