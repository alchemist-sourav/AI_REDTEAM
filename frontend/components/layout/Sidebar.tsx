"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Clock,
  Users,
  Target,
  MessageSquare,
  Folder,
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  requiresRole: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: BarChart2,
    requiresRole: ["admin", "analyst", "viewer"],
  },
  {
    label: "Targets",
    href: "/targets",
    icon: Target,
    requiresRole: ["admin", "analyst", "viewer"],
  },
  {
    label: "Executions",
    href: "/executions",
    icon: Clock,
    requiresRole: ["admin", "analyst"],
  },
  {
    label: "Evaluations",
    href: "/evaluations",
    icon: MessageSquare,
    requiresRole: ["admin", "analyst"],
  },
  {
    label: "Risk Assessment",
    href: "/risk",
    icon: AlertTriangle,
    requiresRole: ["admin", "analyst"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: Folder,
    requiresRole: ["admin", "analyst", "viewer"],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    requiresRole: ["admin"],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  userRole: string;
}

export function Sidebar({ isCollapsed, setIsCollapsed, userRole }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.requiresRole.includes(userRole)
  );

  const isRouteActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 bg-[#080A0B] border-r border-[#292F32] flex flex-col z-50 transition-all duration-300 ease-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#292F32]/50">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="text-sm font-bold text-white">AI_REDTEAM</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded hover:bg-[#23272B]/50 text-gray-400 hover:text-white transition-colors ml-auto"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const routeIsActive = isRouteActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                routeIsActive
                  ? "bg-[#EF4444]/10 text-red-400"
                  : "text-[#A0A0A0] hover:text-white hover:bg-[#23272B]/20 transition-colors"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#292F32]/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-xs text-[#6B7280] capitalize">{userRole}</span>
          )}
        </div>
      </div>
    </aside>
  );
}