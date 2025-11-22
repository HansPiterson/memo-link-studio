import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageLightbox from "./ImageLightbox";
import { Button } from "@/components/ui/button";

interface PublicImage {
  id: string;
  image_url: string;
  image_index: number;
  created_at: string;
  user_id: string;
  username: string;
  likes_count: number;
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
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchPublicImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch images with username from profiles
      const { data: imagesData, error: imagesError } = await supabase
        .from("gallery_images")
        .select(`
          id, 
          image_url, 
          image_index, 
          created_at, 
          user_id,
          profiles!gallery_images_user_id_fkey (username)
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (imagesError) throw imagesError;

      // Fetch likes count for each image
      const imageIds = imagesData?.map(img => img.id) || [];
      const { data: likesData, error: likesError } = await supabase
        .from("gallery_likes")
        .select("image_id, user_id")
        .in("image_id", imageIds);

      if (likesError) throw likesError;

      // Count likes and check if current user has liked each image
      const imagesWithLikes = imagesData?.map(img => {
        const imageLikes = likesData?.filter(like => like.image_id === img.id) || [];
        return {
          id: img.id,
          image_url: img.image_url,
          image_index: img.image_index,
          created_at: img.created_at,
          user_id: img.user_id,
          username: (img.profiles as any)?.username || "Anonymous",
          likes_count: imageLikes.length,
          user_has_liked: user ? imageLikes.some(like => like.user_id === user.id) : false
        };
      }) || [];

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
        title: "Perlu login",
        description: "Silakan login untuk menyukai gambar",
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
            user_id: currentUserId
          });

        if (error) throw error;
      }

      // Update local state
      setImages(images.map(img => {
        if (img.id === imageId) {
          return {
            ...img,
            likes_count: currentlyLiked ? img.likes_count - 1 : img.likes_count + 1,
            user_has_liked: !currentlyLiked
          };
        }
        return img;
      }));
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
          >
            <img
              src={image.image_url}
              alt={`Public image ${image.image_index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              onClick={() => {
                setSelectedImageIndex(index);
                setLightboxOpen(true);
              }}
            />
            
            {/* Username - Top Left */}
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-background/80 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-xs font-medium text-foreground">
                  @{image.username}
                </span>
              </div>
            </div>

            {/* Like Button - Bottom Right */}
            <div className="absolute bottom-2 right-2 z-10">
              <Button
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90 gap-2 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLike(image.id, image.user_has_liked);
                }}
              >
                <Heart 
                  className={`w-4 h-4 ${image.user_has_liked ? 'fill-red-500 text-red-500' : ''}`}
                />
                <span className="text-xs">{image.likes_count}</span>
              </Button>
            </div>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
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
