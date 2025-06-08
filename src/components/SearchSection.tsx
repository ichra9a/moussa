
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchSection = ({
  searchQuery,
  onSearchChange
}: SearchSectionProps) => {
  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 arabic-heading mb-4">
            ابحث عن الفيديوهات
          </h2>
          <p className="text-lg text-slate-600 arabic-text">
            ابحث في مكتبة الفيديوهات التدريبية الشاملة
          </p>
        </div>
        
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="ابحث عن فيديو..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-14 pr-12 pl-4 text-lg rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-200 arabic-text"
            dir="rtl"
          />
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
