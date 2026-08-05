import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Whether the button is in loading state
   */
  isLoading?: boolean;

  /**
   * Text to show when loading
   */
  loadingText?: string;

  /**
   * Button variant
   * - primary: orange to orange gradient (default)
   * - secondary: lighter gradient for borders/backgrounds
   */
  variant?: "primary" | "secondary" | "outline";

  /**
   * Button size
   */
  size?: "sm" | "md" | "lg" | "xl";

  /**
   * Full width button
   */
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 sm:h-11 px-5 sm:px-6 text-sm sm:text-base",
  lg: "h-12 px-6 sm:px-8 text-base",
  xl: "h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg",
};

const variantClasses = {
  primary:
    "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl",

  secondary:
    "bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 hover:border-orange-300",

  outline:
    "border border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400",
};
/**
 * GradientButton - A themed button with gradient background
 *
 * @example
 * ```tsx
 * <GradientButton onClick={handleClick}>
 *   Click me
 * </GradientButton>
 *
 * <GradientButton isLoading loadingText="Processando...">
 *   Submit
 * </GradientButton>
 *
 * <GradientButton variant="outline" size="lg" fullWidth>
 *   Large Outline Button
 * </GradientButton>
 * ```
 */
export const GradientButton = forwardRef<
  HTMLButtonElement,
  GradientButtonProps
>(
  (
    {
      children,
      className,
      disabled,
      isLoading = false,
      loadingText,
      variant = "primary",
      size = "md",
      fullWidth = false,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all group overflow-hidden cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2",

          // Size
          sizeClasses[size],

          // Variant
          variantClasses[variant],

          // Full width
          fullWidth && "w-full",

          // Custom className
          className,
        )}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}

        {/* Button content */}
        <span className={cn("flex items-center", isLoading && "opacity-80")}>
          {isLoading && loadingText ? loadingText : children}
        </span>

        {/* Shine effect overlay */}
        <div
          className="absolute inset-0 bg-linear-to-r from-transparent 
        via-white/20 to-transparent -skew-x-12 translate-x-[-200%] 
        group-hover:translate-x-[200%] transition-transform duration-1000 
        pointer-events-none"
        />
      </button>
    );
  },
);

GradientButton.displayName = "GradientButton";

/**
 * GradientIconButton - A squared gradient button for icons
 */
interface GradientIconButtonProps extends Omit<GradientButtonProps, "size"> {
  size?: "sm" | "md" | "lg";
}

const iconSizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export const GradientIconButton = forwardRef<
  HTMLButtonElement,
  GradientIconButtonProps
>(
  (
    { children, className, size = "md", variant = "primary", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-lg flex items-center justify-center shadow-lg transition-all cursor-pointer",
          "hover:shadow-xl",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          iconSizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

GradientIconButton.displayName = "GradientIconButton";
