
-- Create FAQ categories table
CREATE TABLE public.faq_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create FAQ questions table
CREATE TABLE public.faq_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_faq_categories_order ON public.faq_categories(order_index);
CREATE INDEX idx_faq_questions_category ON public.faq_questions(category_id);
CREATE INDEX idx_faq_questions_order ON public.faq_questions(order_index);

-- Add some sample data
INSERT INTO public.faq_categories (name, description, order_index) VALUES
  ('عام', 'أسئلة عامة حول المنصة', 1),
  ('الدورات', 'أسئلة متعلقة بالدورات والمحتوى', 2),
  ('التقني', 'مشاكل تقنية ودعم فني', 3);

INSERT INTO public.faq_questions (category_id, question, answer, order_index) VALUES
  ((SELECT id FROM public.faq_categories WHERE name = 'عام'), 'كيف يمكنني التسجيل في المنصة؟', 'يمكنك التسجيل من خلال النقر على زر تسجيل الدخول في الصفحة الرئيسية وإدخال بياناتك.', 1),
  ((SELECT id FROM public.faq_categories WHERE name = 'الدورات'), 'كيف يمكنني الاشتراك في دورة؟', 'بعد تسجيل الدخول، يمكنك تصفح الدورات والنقر على تفاصيل الدورة ثم الاشتراك فيها.', 1),
  ((SELECT id FROM public.faq_categories WHERE name = 'التقني'), 'لا يمكنني تشغيل الفيديوهات، ما الحل؟', 'تأكد من اتصالك بالإنترنت وتحديث المتصفح. في حالة استمرار المشكلة، تواصل مع الدعم الفني.', 1);
