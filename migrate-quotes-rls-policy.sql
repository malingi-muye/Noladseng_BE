-- Migration: Fix Quotes RLS Policies
-- Run this SQL in your Supabase SQL Editor to fix quote creation issues

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;

-- Create new policies that allow public quote creation
CREATE POLICY "Anyone can create quotes" ON public.quotes 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all quotes" ON public.quotes 
FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage quotes" ON public.quotes 
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
