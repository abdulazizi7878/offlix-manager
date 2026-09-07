import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const Input = forwardRef(({ label, error, type = "text", icon: Icon, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-medium text-(--foreground)">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-(--muted-foreground)">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full py-2 bg-(--input) text-(--input-foreground) border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--ring) disabled:opacity-50 transition-colors
            ${Icon ? 'pl-10' : 'pl-3'}
            ${isPassword ? 'pr-10' : 'pr-3'}
            ${error ? 'border-(--destructive) focus:ring-(--destructive)' : 'border-(--border)'}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-(--muted-foreground) hover:text-(--foreground) focus:outline-none transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-(--destructive)">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";