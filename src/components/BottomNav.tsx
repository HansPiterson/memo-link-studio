import { Home, Link2, Upload, Image } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onLinkClick?: () => void;
  onUploadClick?: () => void;
  onHomeClick?: () => void;
}

const BottomNav = ({ onLinkClick, onUploadClick, onHomeClick }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    if (location.pathname === "/") {
      // Already on home, just reset to links tab
      onHomeClick?.();
    } else {
      // Navigate to home
      navigate("/");
    }
  };

  const navItems = [
    {
      icon: Home,
      label: "Home",
      onClick: handleHomeClick,
      isActive: location.pathname === "/",
    },
    {
      icon: Link2,
      label: "Link",
      onClick: () => navigate("/my-links"),
      isActive: location.pathname === "/my-links",
    },
    {
      icon: Upload,
      label: "Upload",
      onClick: onUploadClick,
      isActive: false,
    },
    {
      icon: Image,
      label: "Gallery",
      onClick: () => navigate("/gallery"),
      isActive: location.pathname === "/gallery",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border/50 md:hidden">
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
