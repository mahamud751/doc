import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "primary"
    | "gradient";
  size?: "default" | "sm" | "lg" | "icon" | "xl";
  rounded?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      rounded = false,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl":
              variant === "default",
            "bg-destructive text-white hover:bg-destructive/90 shadow-lg":
              variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-white":
              variant === "outline",
            "bg-secondary text-white hover:bg-secondary/80":
              variant === "secondary",
            "hover:bg-accent hover:text-white": variant === "ghost",
            "text-primary underline-offset-4 hover:underline":
              variant === "link",
            "bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl":
              variant === "gradient",
          },
          {
            "h-10 px-4 py-2": size === "default" && !rounded,
            "h-9 rounded-md px-3": size === "sm" && !rounded,
            "h-11 px-8 py-3 text-base": size === "lg" && !rounded,
            "h-14 px-10 py-4 text-lg font-semibold": size === "xl" && !rounded,
            "h-10 w-10": size === "icon" && !rounded,
            "h-10 px-4 py-2 rounded-full": size === "default" && rounded,
            "h-9 rounded-full px-3": size === "sm" && rounded,
            "h-11 px-8 py-3 rounded-full text-base": size === "lg" && rounded,
            "h-14 px-10 py-4 rounded-full text-lg font-semibold":
              size === "xl" && rounded,
            "h-10 w-10 rounded-full": size === "icon" && rounded,
          },
          size !== "icon"
            ? rounded
              ? "rounded-full"
              : "rounded-md"
            : "rounded-full",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
