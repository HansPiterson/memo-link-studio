import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
import { compressImage } from "@/utils/imageCompression";

interface UploadImagesDialogProps {
  onUploadComplete: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const UploadImagesDialog = ({ onUploadComplete, open: controlledOpen, onOpenChange }: UploadImagesDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal 1 gambar untuk diupload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let successCount = 0;
      for (const file of selectedFiles) {
        // Compress image sebelum upload
        const compressedFile = await compressImage(file);
        
        // Upload to storage dengan cache control yang panjang
        const fileExt = 'jpg'; // Always use jpg after compression
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("gallery-images")
          .upload(fileName, compressedFile, {
            cacheControl: '31536000', // Cache 1 tahun
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("gallery-images")
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from("gallery_images")
          .insert({
            user_id: user.id,
            image_url: publicUrl,
            storage_path: fileName,
            image_index: 0,
          });

        if (dbError) throw dbError;
        successCount++;
      }

      toast({
        title: "Berhasil",
        description: `${successCount} gambar berhasil diupload dan dikompresi`,
      });

      setSelectedFiles([]);
      setOpen(false);
      onUploadComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Gambar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Gambar</DialogTitle>
          <DialogDescription>
            Pilih satu atau lebih gambar untuk diupload ke galeri
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
          />

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {selectedFiles.length} gambar dipilih:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={uploading}
          >
            Batal
          </Button>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Mengupload..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadImagesDialog;
