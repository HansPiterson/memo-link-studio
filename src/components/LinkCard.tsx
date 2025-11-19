import { Link2, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface LinkCardProps {
  id: string;
  url: string;
  title?: string;
  category: string;
  thumbnail_url?: string;
  created_at: string;
  onDelete: (id: string) => void;
}

const LinkCard = ({
  id,
  url,
  title,
  category,
  thumbnail_url,
  created_at,
  onDelete,
}: LinkCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(created_at), {
    addSuffix: true,
    locale: localeId,
  });

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden h-full flex flex-col">
      {/* Thumbnail */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        {thumbnail_url ? (
          <img
            src={thumbnail_url}
            alt={title || "Link thumbnail"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Link2 className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Action buttons overlay */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive/90 hover:text-destructive-foreground"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
          {title || "Untitled Link"}
        </h3>
        
        <p className="text-xs text-muted-foreground truncate mb-3">
          {new URL(url).hostname}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
          <span className="px-2 py-0.5 bg-accent rounded-full font-medium">
            {category}
          </span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkCard;
