-- Migration: Add is_featured column to services table
-- Run this SQL in your Supabase SQL Editor to add the missing column

-- Add is_featured column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create index for better performance on featured services queries
CREATE INDEX IF NOT EXISTS idx_services_featured ON public.services(is_featured);

-- Update any existing services to have is_featured = false (already default, but explicit)
UPDATE public.services 
SET is_featured = false 
WHERE is_featured IS NULL;
