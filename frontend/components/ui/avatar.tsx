import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

const sizeMap: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export const Avatar = ({ className, size = "md", children }: AvatarProps) => (
  <div
    className={cn(
      "flex items-center justify-center rounded-full bg-black-200",
      sizeMap[size],
      className
    )}
  >
    {children}
  </div>
);

Avatar.displayName = "Avatar";
