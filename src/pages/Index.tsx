import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Link2, Search } from "lucide-react";
import LinkCard from "@/components/LinkCard";
import AddLinkDialog from "@/components/AddLinkDialog";
import { Input } from "@/components/ui/input";

interface Link {
  id: string;
  url: string;
  title: string | null;
  category: string;
  thumbnail_url: string | null;
  created_at: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchLinks();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setLinks(data || []);
      setFilteredLinks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (searchQuery) {
      const filtered = links.filter(
        (link) =>
          link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLinks(filtered);
    } else {
      setFilteredLinks(links);
    }
  }, [searchQuery, links]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const { error } = await supabase.from("links").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Link dihapus",
        description: "Link berhasil dihapus dari koleksi Anda",
      });

      fetchLinks();
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-6 h-6" />
              <h1 className="text-xl font-semibold">LinkKeeper</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Link Saya</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {links.length} link tersimpan
              </p>
            </div>
            <AddLinkDialog userId={user.id} onLinkAdded={fetchLinks} />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
            />
          </div>

          {/* Links Grid */}
          {filteredLinks.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? "Tidak ada hasil" : "Belum ada link"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Coba kata kunci lain"
                  : "Mulai tambahkan link favorit Anda"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  id={link.id}
                  url={link.url}
                  title={link.title || undefined}
                  category={link.category}
                  thumbnail_url={link.thumbnail_url || undefined}
                  created_at={link.created_at}
                  onDelete={handleDeleteLink}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
