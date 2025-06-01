
import { Search } from 'lucide-react';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchSection = ({ searchQuery, onSearchChange }: SearchSectionProps) => {
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">Find Your Perfect Lesson</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Search through our comprehensive library of coaching videos to find exactly what you need.
          </p>
          
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search videos, topics, or categories..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
