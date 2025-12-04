import { Home, Plus, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onUploadClick?: () => void;
}

const BottomNav = ({ onUploadClick }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-2 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg">
        <button
          onClick={() => navigate("/")}
          className={cn(
            "p-3 rounded-full transition-colors",
            location.pathname === "/"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Home className="w-5 h-5" />
        </button>
        
        <button
          onClick={onUploadClick}
          className="p-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => navigate("/gallery")}
          className={cn(
            "p-3 rounded-full transition-colors",
            location.pathname === "/gallery"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <User className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
