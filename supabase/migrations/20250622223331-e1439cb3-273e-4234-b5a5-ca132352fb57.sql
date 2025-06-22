
-- Create video assignments table to link assignments to specific videos
CREATE TABLE public.video_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  trigger_at_percentage INTEGER NOT NULL DEFAULT 100,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, assignment_id)
);

-- Create assignment questions table for quiz questions
CREATE TABLE public.assignment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student assignment answers table
CREATE TABLE public.student_assignment_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, question_id)
);

-- Create coach course assignments table for coach-specific data isolation
CREATE TABLE public.coach_course_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  course_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  permissions JSONB NOT NULL DEFAULT '{"can_edit": true, "can_delete": false, "can_assign_students": true}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(coach_id, course_id)
);

-- Create coach permissions table
CREATE TABLE public.coach_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  permission_type TEXT NOT NULL,
  resource_id UUID,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_update BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.video_assignments 
ADD CONSTRAINT fk_video_assignments_video FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_video_assignments_assignment FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;

ALTER TABLE public.assignment_questions 
ADD CONSTRAINT fk_assignment_questions_assignment FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;

ALTER TABLE public.student_assignment_answers 
ADD CONSTRAINT fk_student_assignment_answers_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_student_assignment_answers_assignment FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_student_assignment_answers_question FOREIGN KEY (question_id) REFERENCES public.assignment_questions(id) ON DELETE CASCADE;

ALTER TABLE public.coach_course_assignments 
ADD CONSTRAINT fk_coach_course_assignments_coach FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_coach_course_assignments_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.coach_permissions 
ADD CONSTRAINT fk_coach_permissions_coach FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.video_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simplified for now - can be enhanced based on specific requirements)
CREATE POLICY "Anyone can read video assignments" ON public.video_assignments FOR SELECT USING (true);
CREATE POLICY "Anyone can read assignment questions" ON public.assignment_questions FOR SELECT USING (true);
CREATE POLICY "Students can read their own answers" ON public.student_assignment_answers FOR SELECT USING (true);
CREATE POLICY "Students can insert their own answers" ON public.student_assignment_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read coach course assignments" ON public.coach_course_assignments FOR SELECT USING (true);
CREATE POLICY "Anyone can read coach permissions" ON public.coach_permissions FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_video_assignments_video_id ON public.video_assignments(video_id);
CREATE INDEX idx_assignment_questions_assignment_id ON public.assignment_questions(assignment_id);
CREATE INDEX idx_student_assignment_answers_student_id ON public.student_assignment_answers(student_id);
CREATE INDEX idx_student_assignment_answers_assignment_id ON public.student_assignment_answers(assignment_id);
CREATE INDEX idx_coach_course_assignments_coach_id ON public.coach_course_assignments(coach_id);
CREATE INDEX idx_coach_permissions_coach_id ON public.coach_permissions(coach_id);
