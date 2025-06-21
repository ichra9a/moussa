
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import FAQCategoryForm from './FAQCategoryForm';
import FAQQuestionForm from './FAQQuestionForm';
import { useToast } from '@/hooks/use-toast';

interface FAQCategory {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FAQQuestion {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  faq_categories?: {
    name: string;
  };
}

const FAQManagement = () => {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [questions, setQuestions] = useState<FAQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<FAQQuestion | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل التصنيفات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_questions')
        .select(`
          *,
          faq_categories (
            name
          )
        `)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الأسئلة",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faq_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "تم الحذف",
        description: "تم حذف التصنيف بنجاح",
      });
      
      fetchCategories();
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف التصنيف",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faq_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "تم الحذف",
        description: "تم حذف السؤال بنجاح",
      });
      
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف السؤال",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowCategoryForm(false);
    setShowQuestionForm(false);
    setEditingCategory(null);
    setEditingQuestion(null);
    fetchCategories();
    fetchQuestions();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold arabic-heading">إدارة الأسئلة الشائعة</h2>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" className="arabic-text">التصنيفات</TabsTrigger>
          <TabsTrigger value="questions" className="arabic-text">الأسئلة</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold arabic-heading">تصنيفات الأسئلة</h3>
            <Button onClick={() => setShowCategoryForm(true)} className="arabic-text">
              <Plus className="w-4 h-4 ml-2" />
              إضافة تصنيف
            </Button>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="arabic-heading">{category.name}</CardTitle>
                      {category.description && (
                        <p className="text-sm text-gray-600 arabic-text mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCategoryForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold arabic-heading">الأسئلة والأجوبة</h3>
            <Button onClick={() => setShowQuestionForm(true)} className="arabic-text">
              <Plus className="w-4 h-4 ml-2" />
              إضافة سؤال
            </Button>
          </div>

          <div className="grid gap-4">
            {questions.map((question) => (
              <Card key={question.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="arabic-heading text-sm">
                          {question.faq_categories?.name}
                        </CardTitle>
                      </div>
                      <h4 className="font-medium arabic-text">{question.question}</h4>
                      <p className="text-sm text-gray-600 arabic-text mt-2">
                        {question.answer.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingQuestion(question);
                          setShowQuestionForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {showCategoryForm && (
        <FAQCategoryForm
          category={editingCategory}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {showQuestionForm && (
        <FAQQuestionForm
          question={editingQuestion}
          categories={categories}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowQuestionForm(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
};

export default FAQManagement;
