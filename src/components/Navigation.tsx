
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, HelpCircle, Users, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-lg font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600 arabic-heading">منصة التعلم</h1>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
            <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium arabic-text">
              الرئيسية
            </Link>
            <Link to="#about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium arabic-text flex items-center gap-2">
              <Users size={16} />
              من نحن
            </Link>
            <Link to="#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium arabic-text flex items-center gap-2">
              <Mail size={16} />
              تواصل معنا
            </Link>
            <Link to="/faq" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium arabic-text flex items-center gap-2">
              <HelpCircle size={16} />
              الأسئلة الشائعة
            </Link>
            <Link to="/auth">
              <Button className="arabic-text">تسجيل الدخول</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium arabic-text"
                onClick={() => setIsOpen(false)}
              >
                الرئيسية
              </Link>
              <Link
                to="#about"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium arabic-text flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Users size={16} />
                من نحن
              </Link>
              <Link
                to="#contact"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium arabic-text flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Mail size={16} />
                تواصل معنا
              </Link>
              <Link
                to="/faq"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium arabic-text flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle size={16} />
                الأسئلة الشائعة
              </Link>
              <Link
                to="/auth"
                className="block px-3 py-2"
                onClick={() => setIsOpen(false)}
              >
                <Button className="w-full arabic-text">تسجيل الدخول</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
