import React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "bg-[#181C20] border border-[#3A3F45]/50 rounded-md w-full px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus-ring-[#3A3F45]/40 transition-colors",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";