
-- Enable RLS on coaches table (if not already enabled)
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on coaches table for now
-- This allows admins to manage coaches without authentication constraints
CREATE POLICY "Allow all operations on coaches" 
  ON public.coaches 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
