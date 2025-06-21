
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

interface FAQCategory {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  faq_questions: FAQQuestion[];
}

const FAQ = () => {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_categories')
        .select(`
          id,
          name,
          description,
          order_index,
          faq_questions!inner (
            id,
            question,
            answer,
            order_index
          )
        `)
        .eq('is_active', true)
        .eq('faq_questions.is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Sort questions within each category
      const sortedData = data?.map(category => ({
        ...category,
        faq_questions: category.faq_questions.sort((a, b) => a.order_index - b.order_index)
      })) || [];

      setCategories(sortedData);
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    faq_questions: category.faq_questions.filter(
      question =>
        question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faq_questions.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl">
        <Navigation />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mr-4 arabic-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 arabic-heading mb-4">
            الأسئلة الشائعة
          </h1>
          <p className="text-xl text-gray-600 arabic-text">
            جميع الإجابات التي تحتاجها في مكان واحد
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="ابحث في الأسئلة الشائعة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 text-lg arabic-text"
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 arabic-text">لم يتم العثور على أسئلة مطابقة لبحثك</p>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 arabic-heading">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-gray-600 arabic-text mt-2">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {category.faq_questions.map((question) => (
                    <Card key={question.id} className="overflow-hidden">
                      <CardHeader
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleQuestion(question.id)}
                      >
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg arabic-heading text-right flex-1">
                            {question.question}
                          </CardTitle>
                          {expandedQuestions.has(question.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 mr-4" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 mr-4" />
                          )}
                        </div>
                      </CardHeader>
                      
                      {expandedQuestions.has(question.id) && (
                        <CardContent className="border-t pt-4">
                          <div className="prose prose-lg max-w-none arabic-text text-gray-700 leading-relaxed">
                            {question.answer.split('\n').map((paragraph, index) => (
                              <p key={index} className="mb-3">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact Section */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-bold text-gray-900 arabic-heading mb-4">
              لم تجد إجابة لسؤالك؟
            </h3>
            <p className="text-gray-600 arabic-text mb-6">
              تواصل معنا وسنكون سعداء لمساعدتك
            </p>
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors arabic-text"
            >
              تواصل معنا
            </a>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
