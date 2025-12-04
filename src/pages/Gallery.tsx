import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Image as ImageIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UploadImagesDialog from "@/components/UploadImagesDialog";
import ImageLightbox from "@/components/ImageLightbox";
import BottomNav from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Globe, Lock } from "lucide-react";

interface GalleryImage {
  id: string;
  image_url: string;
  storage_path: string;
  instagram_post_url: string;
  image_index: number;
  created_at: string;
  link_id: string;
  is_public: boolean;
}

const Gallery = () => {
  const [user, setUser] = useState<User | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchGalleryImages();
      }
      setLoading(false);
    });
  }, [navigate]);

  const fetchGalleryImages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setImages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (id: string, storagePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("gallery-images")
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast({
        title: "Gambar dihapus",
        description: "Gambar berhasil dihapus dari galeri",
      });

      fetchGalleryImages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from("gallery_images")
        .update({ is_public: !currentVisibility })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Visibilitas diubah",
        description: !currentVisibility ? "Gambar sekarang public" : "Gambar sekarang private",
      });

      fetchGalleryImages();
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
            )}
            <div className="flex items-center gap-2">
              <ImageIcon className="w-6 h-6" />
              <h1 className="text-xl font-semibold">Galeri Instagram</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Gambar Tersimpan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {images.length} gambar tersimpan
              </p>
            </div>
            {!isMobile && (
              <UploadImagesDialog onUploadComplete={fetchGalleryImages} />
            )}
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Belum ada gambar</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tambahkan link postingan Instagram untuk otomatis menyimpan gambar
              </p>
              <Button onClick={() => navigate("/")}>
                Kembali ke Link
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={image.image_url}
                    alt={`Gallery image ${image.image_index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                  
                  {/* Visibility indicator */}
                  <div className="absolute top-2 left-2 z-10">
                    {image.is_public ? (
                      <div className="bg-background/80 backdrop-blur-sm rounded-full p-1.5">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                    ) : (
                      <div className="bg-background/80 backdrop-blur-sm rounded-full p-1.5">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Three dot menu */}
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem
                          onClick={() => handleToggleVisibility(image.id, image.is_public)}
                        >
                          {image.is_public ? (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Jadikan Private
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4 mr-2" />
                              Jadikan Public
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const index = images.findIndex(img => img.id === image.id);
                        setSelectedImageIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      Lihat Poto
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus gambar?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Gambar akan dihapus permanen dari galeri Anda.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteImage(image.id, image.storage_path)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        onUploadClick={() => setUploadDialogOpen(true)}
      />

      {/* Hidden UploadImagesDialog for mobile bottom nav */}
      {isMobile && (
        <UploadImagesDialog
          onUploadComplete={fetchGalleryImages}
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />
      )}

      {images.length > 0 && (
        <ImageLightbox
          imageUrl={images[selectedImageIndex]?.image_url}
          alt={`Gallery image ${images[selectedImageIndex]?.image_index + 1}`}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          onPrevious={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setSelectedImageIndex(prev => Math.min(images.length - 1, prev + 1))}
          hasPrevious={selectedImageIndex > 0}
          hasNext={selectedImageIndex < images.length - 1}
        />
      )}
    </div>
  );
};

export default Gallery;
