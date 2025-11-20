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

  // Decode HTML entities in case any slipped through
  const decodeHtml = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const displayTitle = title ? decodeHtml(title) : "Untitled Link";
  const displayThumbnail = thumbnail_url ? decodeHtml(thumbnail_url) : null;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden h-full flex flex-col">
      {/* Thumbnail */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        {displayThumbnail ? (
          <img
            src={displayThumbnail}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Hide broken images
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full flex items-center justify-center';
                fallback.innerHTML = '<svg class="w-12 h-12 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
                parent.appendChild(fallback);
              }
            }}
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
          {displayTitle}
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
