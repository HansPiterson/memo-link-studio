import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddLinkDialogProps {
  userId: string;
  onLinkAdded: () => void;
}

const AddLinkDialog = ({ userId, onLinkAdded }: AddLinkDialogProps) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const detectCategory = (url: string): string => {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      if (domain.includes("instagram.com")) return "Instagram";
      if (domain.includes("youtube.com") || domain.includes("youtu.be")) return "YouTube";
      if (domain.includes("twitter.com") || domain.includes("x.com")) return "Twitter";
      if (domain.includes("facebook.com")) return "Facebook";
      if (domain.includes("tiktok.com")) return "TikTok";
      if (domain.includes("linkedin.com")) return "LinkedIn";
      if (domain.includes("github.com")) return "GitHub";
      if (domain.includes("reddit.com")) return "Reddit";
      if (domain.includes("pinterest.com")) return "Pinterest";
      
      return "Website";
    } catch {
      return "Unknown";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const category = detectCategory(url);
      
      const { error } = await supabase
        .from("links")
        .insert({
          user_id: userId,
          url,
          title: title || null,
          category,
          thumbnail_url: null, // Untuk demo, bisa dikembangkan lebih lanjut
        });

      if (error) throw error;

      toast({
        title: "Link berhasil ditambahkan",
        description: `Kategori: ${category}`,
      });

      setUrl("");
      setTitle("");
      setOpen(false);
      onLinkAdded();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Tambah Link Baru</DialogTitle>
          <DialogDescription>
            Masukkan URL yang ingin Anda simpan. Kategori akan terdeteksi otomatis.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="bg-input border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul (Opsional)</Label>
            <Input
              id="title"
              type="text"
              placeholder="My Favorite Link"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input border-border/50"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLinkDialog;
