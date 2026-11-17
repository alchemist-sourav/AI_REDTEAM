"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
  userRole: string;
  userEmail: string;
}

export function MainLayout({ children, userRole, userEmail }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  return (
    <div className="min-h-screen bg-black-100 flex">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={toggleSidebar}
        userRole={userRole}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
        <Header
          userRole={userRole}
          userEmail={userEmail}
          isCollapsed={isCollapsed}
        />
        <main className="flex-1 pt-16">{children}</main>
      </div>
    </div>
  );
}
