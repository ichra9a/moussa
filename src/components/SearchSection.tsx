
import { Search } from 'lucide-react';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchSection = ({ searchQuery, onSearchChange }: SearchSectionProps) => {
  return (
    <section className="bg-white py-12 font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mobile-app">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-slate-900 arabic-heading high-contrast">ابحث عن الدرس المناسب</h2>
          <p className="text-slate-600 max-w-2xl mx-auto arabic-text">
            ابحث في مكتبتنا الشاملة من فيديوهات التدريب للعثور على ما تحتاجه بالضبط.
          </p>
          
          <div className="max-w-2xl mx-auto relative px-4 md:px-0">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="ابحث في الفيديوهات، المواضيع، أو الفئات..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pr-12 pl-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg arabic-text text-right mobile-search focus-enhanced transition-smooth"
                dir="rtl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
