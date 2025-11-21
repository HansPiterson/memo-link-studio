import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  imageUrl: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const ImageLightbox = ({ 
  imageUrl, 
  alt, 
  open, 
  onOpenChange,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}: ImageLightboxProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-transparent">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-6 h-6" />
          </Button>
          
          {hasPrevious && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={onPrevious}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}
          
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={onNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}
          
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[95vh] object-contain rounded-lg"
            loading="eager"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
