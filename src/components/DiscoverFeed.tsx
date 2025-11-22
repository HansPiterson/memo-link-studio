import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageLightbox from "./ImageLightbox";

interface PublicImage {
  id: string;
  image_url: string;
  image_index: number;
  created_at: string;
  user_id: string;
}

const DiscoverFeed = () => {
  const [images, setImages] = useState<PublicImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchPublicImages();
  }, []);

  const fetchPublicImages = async () => {
    try {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("id, image_url, image_index, created_at, user_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setImages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Belum ada gambar public</h3>
        <p className="text-sm text-muted-foreground">
          Gambar yang dibagikan ke public akan muncul di sini
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
            onClick={() => {
              setSelectedImageIndex(index);
              setLightboxOpen(true);
            }}
          >
            <img
              src={image.image_url}
              alt={`Public image ${image.image_index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <ImageLightbox
          imageUrl={images[selectedImageIndex]?.image_url}
          alt={`Public image ${images[selectedImageIndex]?.image_index + 1}`}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          onPrevious={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setSelectedImageIndex(prev => Math.min(images.length - 1, prev + 1))}
          hasPrevious={selectedImageIndex > 0}
          hasNext={selectedImageIndex < images.length - 1}
        />
      )}
    </>
  );
};

export default DiscoverFeed;
