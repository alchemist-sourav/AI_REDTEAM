import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "destructive" | "success" | "warning";
  className?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-[#292F32] text-[#A0A0A0]",
  destructive: "bg-red-600 text-white",
  success: "bg-green-600 text-white",
  warning: "bg-amber-500 text-white",
};

export const Badge = ({
  variant = "default",
  className,
  children,
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      variantClasses[variant],
      className
    )}
  >
    {children}
  </span>
);

Badge.displayName = "Badge";