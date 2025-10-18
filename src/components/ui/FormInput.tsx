import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, LucideIcon } from "lucide-react";

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  showPasswordToggle?: boolean;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      className,
      label,
      icon: Icon,
      error,
      showPasswordToggle = false,
      type = "text",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle && showPassword ? "text" : type;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <Input
            type={inputType}
            ref={ref}
            className={cn(
              Icon ? "pl-10" : "",
              showPasswordToggle ? "pr-10" : "",
              error ? "border-destructive" : "",
              className
            )}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Eye className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export { FormInput };
