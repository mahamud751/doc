import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border border-border text-foreground",
    success: "bg-green-100 text-green-800",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs rounded",
    md: "px-2.5 py-0.5 text-sm rounded-md",
    lg: "px-3 py-1 text-base rounded-lg",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
