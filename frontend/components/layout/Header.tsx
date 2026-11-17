"use client";

import { useState } from "react";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  userRole: string;
  userEmail: string;
  isCollapsed?: boolean;
}

export function Header({ userRole, userEmail, isCollapsed }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header
      className={`bg-[#080A0B]/80 backdrop-blur border-b border-[#292F32]/50 fixed top-0 right-0 h-16 flex items-center px-6 transition-all duration-300 ${
        isCollapsed ? "left-16" : "left-64"
      }`}
    >
      <div className="flex-1" />
      <div className="flex items-center gap-6">
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-[#A0A0A0] hover:text-white hover:bg-[#23272B]/20 transition-colors"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="User menu"
          >
            <User className="w-4 h-4" />
            <span>{userEmail}</span>
            <span className="text-xs text-[#6B7280] capitalize">
              ({userRole})
            </span>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-1 w-44 bg-[#181C20] border border-[#3A3F45] rounded shadow-lg py-1 z-50"
            >
              <button
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#23272B]/20 transition-colors flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}