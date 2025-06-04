
-- Create a function to create students that bypasses RLS
CREATE OR REPLACE FUNCTION create_student(
  pin_code TEXT,
  full_name TEXT,
  email TEXT,
  first_name TEXT DEFAULT NULL,
  last_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_student_id UUID;
BEGIN
  INSERT INTO public.students (pin_code, full_name, email, first_name, last_name)
  VALUES (pin_code, full_name, email, first_name, last_name)
  RETURNING id INTO new_student_id;
  
  RETURN new_student_id;
END;
$$;
