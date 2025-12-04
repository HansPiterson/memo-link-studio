import { Home, Upload, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onUploadClick?: () => void;
}

const BottomNav = ({ onUploadClick }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      onClick: () => navigate("/"),
      isActive: location.pathname === "/",
    },
    {
      icon: Upload,
      label: "Upload",
      onClick: onUploadClick,
      isActive: false,
    },
    {
      icon: User,
      label: "Profile",
      onClick: () => navigate("/gallery"),
      isActive: location.pathname === "/gallery",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50">
      <div className="max-w-md mx-auto flex items-center justify-around px-4 py-3">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center gap-1 px-6 py-2 rounded-full transition-all",
              item.isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className={cn("w-6 h-6", item.isActive && "scale-110")} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
