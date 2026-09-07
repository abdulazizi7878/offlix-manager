import { forwardRef } from "react";
import { LoaderCircle } from "lucide-react";

export const Button = forwardRef(({ children, isLoading, variant = "primary", className = "", ...props }, ref) => {
  const baseStyles = "w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-(--ring) disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  
  const variants = {
    primary: "bg-(--primary) text-(--primary-foreground) hover:opacity-90",
    secondary: "bg-(--muted) text-(--muted-foreground) hover:bg-(--accent) hover:text-(--accent-foreground)",
    ghost: "bg-transparent text-(--foreground) hover:bg-(--muted) shadow-none",
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <LoaderCircle className="animate-spin -ml-1 mr-2 h-5 w-5" aria-hidden="true" />}
      {children}
    </button>
  );
});

Button.displayName = "Button";