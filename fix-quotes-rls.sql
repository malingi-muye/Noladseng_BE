-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

-- Create comprehensive RLS policies for quotes table

-- Allow anyone to create quotes (no auth required)
CREATE POLICY "Anyone can create quotes" ON public.quotes 
FOR INSERT WITH CHECK (true);

-- Allow users to view their own quotes
CREATE POLICY "Users can view own quotes" ON public.quotes 
FOR SELECT USING (
  auth.uid()::text = user_id::text 
  OR auth.jwt() ->> 'role' = 'admin'
);

-- Allow admins to manage all quotes
CREATE POLICY "Admins can manage quotes" ON public.quotes 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');