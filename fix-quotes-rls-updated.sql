-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

-- Create comprehensive RLS policies for quotes table

-- Allow anyone to create quotes, with or without auth
CREATE POLICY "Anyone can create quotes" ON public.quotes 
FOR INSERT WITH CHECK (
    -- Either the row has no user_id (anonymous quote)
    user_id IS NULL 
    -- Or the user_id matches the authenticated user
    OR auth.uid()::text = user_id::text
);

-- Allow users to view quotes they created
CREATE POLICY "Users can view own quotes" ON public.quotes 
FOR SELECT USING (
    -- Either the quote was created anonymously
    user_id IS NULL
    -- Or the user_id matches the authenticated user
    OR auth.uid()::text = user_id::text
    -- Or the user is an admin
    OR auth.jwt() ->> 'role' = 'admin'
);

-- Allow admins full access
CREATE POLICY "Admins can manage quotes" ON public.quotes 
FOR ALL USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Update quotes table to allow NULL user_id
ALTER TABLE public.quotes ALTER COLUMN user_id DROP NOT NULL;