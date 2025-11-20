-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create gallery_images table
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  link_id UUID REFERENCES public.links(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  instagram_post_url TEXT,
  image_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own gallery images"
ON public.gallery_images
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gallery images"
ON public.gallery_images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery images"
ON public.gallery_images
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for gallery-images bucket
CREATE POLICY "Users can view their own gallery images in storage"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own gallery images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'gallery-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own gallery images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'gallery-images' AND auth.uid()::text = (storage.foldername(name))[1]);