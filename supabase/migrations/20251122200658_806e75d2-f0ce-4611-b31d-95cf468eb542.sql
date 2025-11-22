-- Create likes table for gallery images
CREATE TABLE public.gallery_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id uuid NOT NULL REFERENCES public.gallery_images(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, image_id)
);

-- Enable RLS
ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes
CREATE POLICY "Anyone can view likes"
ON public.gallery_likes
FOR SELECT
USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can like images"
ON public.gallery_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can unlike images"
ON public.gallery_likes
FOR DELETE
USING (auth.uid() = user_id);