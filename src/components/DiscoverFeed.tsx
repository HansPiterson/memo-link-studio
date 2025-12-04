import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageLightbox from "./ImageLightbox";

interface PublicImage {
  id: string;
  image_url: string;
  image_index: number;
  created_at: string;
  user_id: string;
  like_count: number;
  user_has_liked: boolean;
}

const DiscoverFeed = () => {
  const [images, setImages] = useState<PublicImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchPublicImages();
  }, []);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const fetchPublicImages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data, error } = await supabase
        .from("gallery_images")
        .select("id, image_url, image_index, created_at, user_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch like counts and user likes for each image
      const imagesWithLikes = await Promise.all(
        (data || []).map(async (image) => {
          const { count } = await supabase
            .from("gallery_likes")
            .select("*", { count: "exact", head: true })
            .eq("image_id", image.id);

          let userHasLiked = false;
          if (userId) {
            const { data: likeData } = await supabase
              .from("gallery_likes")
              .select("id")
              .eq("image_id", image.id)
              .eq("user_id", userId)
              .maybeSingle();
            userHasLiked = !!likeData;
          }

          return {
            ...image,
            like_count: count || 0,
            user_has_liked: userHasLiked,
          };
        })
      );

      setImages(imagesWithLikes);
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

  const handleToggleLike = async (imageId: string, currentlyLiked: boolean) => {
    if (!currentUserId) {
      toast({
        title: "Login required",
        description: "Silakan login untuk memberikan like",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from("gallery_likes")
          .delete()
          .eq("image_id", imageId)
          .eq("user_id", currentUserId);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("gallery_likes")
          .insert({
            image_id: imageId,
            user_id: currentUserId,
          });

        if (error) throw error;
      }

      // Update local state
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === imageId
            ? {
                ...img,
                user_has_liked: !currentlyLiked,
                like_count: currentlyLiked ? img.like_count - 1 : img.like_count + 1,
              }
            : img
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      {/* Clean Masonry Grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative break-inside-avoid rounded-xl overflow-hidden bg-muted mb-2 cursor-pointer"
            onClick={() => {
              setSelectedImageIndex(index);
              setLightboxOpen(true);
            }}
          >
            <img
              src={image.image_url}
              alt={`Image ${image.image_index + 1}`}
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
            
            {/* Minimal overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Like button - bottom left on hover */}
            <button
              className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-black text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike(image.id, image.user_has_liked);
              }}
            >
              <Heart
                className={`w-3.5 h-3.5 ${image.user_has_liked ? "fill-red-500 text-red-500" : ""}`}
              />
              {image.like_count > 0 && <span>{image.like_count}</span>}
            </button>
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <ImageLightbox
          imageUrl={images[selectedImageIndex]?.image_url}
          alt={`Image ${images[selectedImageIndex]?.image_index + 1}`}
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
