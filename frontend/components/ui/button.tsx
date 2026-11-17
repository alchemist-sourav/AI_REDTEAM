import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-[#292F32] text-white hover:bg-[#3A3F45] focus-visible:ring-2 focus-visible:ring-[#3A3F45]/40",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500",
  outline: "border border-[#3A3F45] text-white hover:bg-[#23272B] focus-visible:ring-2 focus-visible:ring-[#3A3F45]/40",
  secondary: "bg-[#23272B]/50 text-white hover:bg-[#23272B] focus-visible:ring-2 focus-visible:ring-[#23272B]/40",
  ghost: "hover:bg-[#23272B]/20 text-white focus-visible:ring-2 focus-visible:ring-[#3A3F45]/40",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-8 text-base",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";