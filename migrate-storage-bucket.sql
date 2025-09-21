-- Migration: Create Supabase Storage Bucket for Images
-- Run this SQL in your Supabase SQL Editor to create the storage bucket and policies

-- Create the 'images' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the images bucket

-- Policy 1: Allow public read access to all images
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Policy 2: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow users to update their own images (optional)
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow users to delete their own images (optional)
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Policy 5: Allow admins to manage all images
CREATE POLICY "Admins can manage all images" ON storage.objects
FOR ALL USING (
  bucket_id = 'images' 
  AND auth.jwt() ->> 'role' = 'admin'
);
