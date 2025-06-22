
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  BarChart3,
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  coachName: string;
}

const CoachSidebar = ({ activeTab, onTabChange, onLogout, coachName }: CoachSidebarProps) => {
  const menuItems = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'students', label: 'الطلاب', icon: Users },
    { id: 'courses', label: 'الدورات', icon: BookOpen },
    { id: 'assignments', label: 'الواجبات', icon: FileText },
    { id: 'questions', label: 'الأسئلة', icon: MessageSquare },
  ];

  return (
    <div className="h-full w-64 bg-white border-l border-gray-200 flex flex-col font-cairo" dir="rtl">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 arabic-heading">لوحة المدرب</h2>
        <p className="text-sm text-gray-600 arabic-text mt-1">{coachName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start arabic-text",
                    activeTab === item.id && "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="ml-3 h-5 w-5" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          className="w-full arabic-text"
          onClick={onLogout}
        >
          <LogOut className="ml-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
};

export default CoachSidebar;
