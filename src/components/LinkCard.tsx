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
    <Card className="group hover:shadow-md transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {thumbnail_url ? (
              <img
                src={thumbnail_url}
                alt={title || "Link thumbnail"}
                className="w-full h-full object-cover"
              />
            ) : (
              <Link2 className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {title || "Untitled Link"}
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {url}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 bg-accent rounded-full font-medium">
                {category}
              </span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkCard;
