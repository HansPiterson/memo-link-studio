-- Add is_public column to gallery_images table
ALTER TABLE public.gallery_images 
ADD COLUMN is_public boolean DEFAULT false NOT NULL;

-- Update RLS policy to allow public access to public images
CREATE POLICY "Anyone can view public gallery images"
ON public.gallery_images
FOR SELECT
USING (is_public = true);

-- Add policy to allow users to update visibility of their own images
CREATE POLICY "Users can update their own gallery images visibility"
ON public.gallery_images
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);