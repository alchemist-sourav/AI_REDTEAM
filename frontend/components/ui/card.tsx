import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  title?: string;
  children: React.ReactNode;
}

export const Card = ({ className, title, children }: CardProps) => (
  <div
    className={cn(
      "bg-[#181C20] border border-[#3A3F45]/50 rounded-lg p-6",
      className
    )}
  >
    {title && (
      <h4 className="text-sm font-medium text-white mb-4">{title}</h4>
    )}
    {children}
  </div>
);

Card.displayName = "Card";