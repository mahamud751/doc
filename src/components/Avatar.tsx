import { User } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: AvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  const initials = name ? getInitials(name) : "";

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium ${sizeClasses[size]} ${className}`}
    >
      {initials || <User className="h-1/2 w-1/2" />}
    </div>
  );
}
