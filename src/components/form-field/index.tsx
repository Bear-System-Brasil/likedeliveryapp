import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  icon?: ReactNode;
  required?: boolean;
  className?: string;
  children?: ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

/**
 * Reusable form field component with consistent styling
 */
export function FormField({
  label,
  id,
  error,
  icon,
  required = false,
  className,
  children,
  inputProps,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {children || (
          <Input
            id={id}
            className={cn(
              "rounded-xl border-2 border-gray-200 focus:border-orange-400",
              icon && "pl-10",
              error && "border-red-500 focus:border-red-500",
            )}
            {...inputProps}
          />
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
