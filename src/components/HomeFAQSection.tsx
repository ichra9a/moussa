
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Search, Plus, HelpCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import QuestionSubmissionForm from './QuestionSubmissionForm';

interface FAQCategory {
  id: string;
  name: string;
  description: string;
}

interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
  category_id: string;
  category: FAQCategory;
}

const HomeFAQSection = () => {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [questions, setQuestions] = useState<FAQQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<FAQQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());
  const [showMore, setShowMore] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const INITIAL_DISPLAY_COUNT = 6;

  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('faq_categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index');
    
    if (data) setCategories(data);
  };

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('faq_questions')
      .select(`
        *,
        faq_categories (
          id,
          name,
          description
        )
      `)
      .eq('is_active', true)
      .order('order_index');
    
    if (data) {
      const questionsWithCategory = data.map(q => ({
        ...q,
        category: q.faq_categories
      }));
      setQuestions(questionsWithCategory);
    }
    setLoading(false);
  };

  const filterQuestions = () => {
    let filtered = questions;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category_id === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.answer.toLowerCase().includes(query)
      );
    }

    setFilteredQuestions(filtered);
  };

  const toggleQuestion = (questionId: string) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(questionId)) {
      newOpenQuestions.delete(questionId);
    } else {
      newOpenQuestions.add(questionId);
    }
    setOpenQuestions(newOpenQuestions);
  };

  const displayedQuestions = showMore 
    ? filteredQuestions 
    : filteredQuestions.slice(0, INITIAL_DISPLAY_COUNT);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 arabic-text">جاري تحميل الأسئلة...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 arabic-heading">
              الأسئلة الشائعة
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto arabic-text">
            ابحث عن إجابات لأسئلتك أو اطرح سؤالاً جديداً
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="ابحث في الأسئلة والأجوبة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 arabic-text"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-64 arabic-text">
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setShowSubmissionForm(true)}
            className="w-full md:w-auto arabic-text flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            اطرح سؤالاً
          </Button>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2 arabic-text">
                لم يتم العثور على أسئلة
              </h3>
              <p className="text-gray-500 arabic-text">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'جرب تغيير البحث أو التصنيف'
                  : 'لا توجد أسئلة متاحة حالياً'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedQuestions.map((question) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <Collapsible
                  open={openQuestions.has(question.id)}
                  onOpenChange={() => toggleQuestion(question.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 arabic-text mb-2">
                            {highlightText(question.question, searchQuery)}
                          </h3>
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm arabic-text">
                            {question.category.name}
                          </span>
                        </div>
                        <div className="mr-4">
                          {openQuestions.has(question.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-6 pb-6 border-t bg-gray-50">
                      <div className="pt-4">
                        <p className="text-gray-700 leading-relaxed arabic-text">
                          {highlightText(question.answer, searchQuery)}
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}

            {/* Load More Button */}
            {filteredQuestions.length > INITIAL_DISPLAY_COUNT && (
              <div className="text-center pt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowMore(!showMore)}
                  className="arabic-text"
                >
                  {showMore ? 'عرض أقل' : `عرض المزيد (${filteredQuestions.length - INITIAL_DISPLAY_COUNT} أسئلة أخرى)`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Question Submission Form */}
        {showSubmissionForm && (
          <QuestionSubmissionForm
            categories={categories}
            onClose={() => setShowSubmissionForm(false)}
            onSuccess={() => {
              setShowSubmissionForm(false);
              // Optionally refresh questions or show success message
            }}
          />
        )}
      </div>
    </section>
  );
};

export default HomeFAQSection;
