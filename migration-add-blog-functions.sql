-- Migration: Add missing blog post management functions (FIXED VERSION)
-- Run this SQL in your Supabase SQL Editor to add the missing functions

-- First, drop any existing functions with the same name to avoid conflicts
DROP FUNCTION IF EXISTS public.create_blog_post(JSONB, INTEGER[]);
DROP FUNCTION IF EXISTS public.update_blog_post(BIGINT, JSONB, INTEGER[]);
DROP FUNCTION IF EXISTS public.create_blog_post(JSONB, TEXT[]);
DROP FUNCTION IF EXISTS public.update_blog_post(BIGINT, JSONB, TEXT[]);

-- Create blog post management functions
CREATE OR REPLACE FUNCTION create_blog_post(
    post_data JSONB,
    tag_ids JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    new_post_id BIGINT;
    result JSONB;
    tags_array TEXT[];
BEGIN
    -- Convert tag_ids JSONB to TEXT[] if provided
    IF tag_ids IS NOT NULL THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(tag_ids)) INTO tags_array;
    END IF;
    
    -- Insert the blog post
    INSERT INTO public.blog_posts (
        title,
        slug,
        content,
        excerpt,
        featured_image,
        category,
        tags,
        author_id,
        status,
        published_at,
        meta_title,
        meta_description
    ) VALUES (
        (post_data->>'title')::VARCHAR(255),
        (post_data->>'slug')::VARCHAR(255),
        (post_data->>'content')::TEXT,
        (post_data->>'excerpt')::TEXT,
        (post_data->>'featured_image')::TEXT,
        (post_data->>'category')::VARCHAR(100),
        COALESCE(tags_array, (post_data->'tags')::TEXT[]),
        (post_data->>'author_id')::BIGINT,
        COALESCE((post_data->>'status')::VARCHAR(20), 'draft'),
        CASE 
            WHEN (post_data->>'status')::VARCHAR(20) = 'published' THEN NOW()
            ELSE NULL
        END,
        (post_data->>'meta_title')::VARCHAR(255),
        (post_data->>'meta_description')::TEXT
    ) RETURNING id INTO new_post_id;
    
    -- Return the created post data
    SELECT to_jsonb(bp.*) INTO result
    FROM public.blog_posts bp
    WHERE bp.id = new_post_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_blog_post(
    post_id BIGINT,
    post_updates JSONB,
    tag_ids JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    tags_array TEXT[];
BEGIN
    -- Convert tag_ids JSONB to TEXT[] if provided
    IF tag_ids IS NOT NULL THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(tag_ids)) INTO tags_array;
    END IF;
    
    -- Update the blog post
    UPDATE public.blog_posts SET
        title = COALESCE((post_updates->>'title')::VARCHAR(255), title),
        slug = COALESCE((post_updates->>'slug')::VARCHAR(255), slug),
        content = COALESCE((post_updates->>'content')::TEXT, content),
        excerpt = COALESCE((post_updates->>'excerpt')::TEXT, excerpt),
        featured_image = COALESCE((post_updates->>'featured_image')::TEXT, featured_image),
        category = COALESCE((post_updates->>'category')::VARCHAR(100), category),
        tags = COALESCE(tags_array, (post_updates->'tags')::TEXT[], tags),
        author_id = COALESCE((post_updates->>'author_id')::BIGINT, author_id),
        status = COALESCE((post_updates->>'status')::VARCHAR(20), status),
        published_at = CASE 
            WHEN (post_updates->>'status')::VARCHAR(20) = 'published' AND published_at IS NULL THEN NOW()
            WHEN (post_updates->>'status')::VARCHAR(20) != 'published' THEN NULL
            ELSE published_at
        END,
        meta_title = COALESCE((post_updates->>'meta_title')::VARCHAR(255), meta_title),
        meta_description = COALESCE((post_updates->>'meta_description')::TEXT, meta_description),
        updated_at = NOW()
    WHERE id = post_id;
    
    -- Return the updated post data
    SELECT to_jsonb(bp.*) INTO result
    FROM public.blog_posts bp
    WHERE bp.id = post_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
