"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  FileText,
  Brain,
  BookOpen,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  CircleHelp,
  Menu,
  X,
  Sparkles,
  Trophy,
  Compass,
  Users,
  BarChart2,
  UserCircle2,
  Heart,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Profile",
    href: "/career/profile",
    icon: UserCircle2,
  },
  {
    label: "Skill Gap Intelligence",
    href: "/career/analyse",
    icon: BarChart2,
  },
  {
    label: "Learning Modules",
    href: "/career/modules",
    icon: BookOpen,
  },
  {
    label: "Achievements",
    href: "/dashboard/achievements",
    icon: Trophy,
  },
  {
    label: "Care Space",
    href: "/dashboard/carespace",
    icon: Heart,
  },
];

const pendingNavItems: NavItem[] = [
  {
    label: "My Learning Path",
    href: "/dashboard/learning-path",
    icon: Compass,
    badge: "New",
  },
  {
    label: "Upload Resources",
    href: "/dashboard/upload",
    icon: FileText,
  },
  {
    label: "Tutor Room",
    href: "/dashboard/tutor",
    icon: Brain,
    badge: "AI",
  },
  {
    label: "Notes & Exercises",
    href: "/dashboard/notes",
    icon: BookOpen,
  },
  {
    label: "Community Pods",
    href: "/dashboard/community",
    icon: Users,
  },
  {
    label: "Progress",
    href: "/dashboard/progress",
    icon: BarChart3,
  },
  {
    label: "Resume Builder",
    href: "/career/resume",
    icon: FileText,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "Help & Support",
    href: "/dashboard/help",
    icon: CircleHelp,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const userName = user?.user_metadata?.full_name || "My Account";
  const userEmail = user?.email || "";
  const initial = userName.charAt(0).toUpperCase();

  const renderNavItem = (item: NavItem) => {
    const active =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          active
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
        )}
      >
        {/* Active indicator bar */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
        )}
        <Icon
          size={18}
          className={cn(
            "shrink-0 transition-colors",
            active ? "text-primary" : "text-gray-400 group-hover:text-gray-600",
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-primary to-accent text-white">
            <Sparkles size={8} />
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center border-b border-gray-100 pl-2 pr-3 shrink-0",
          collapsed ? "h-16 justify-center" : "h-16 justify-between",
        )}
      >
        <Link href="/dashboard" className="flex items-center group">
          <div
            className="overflow-hidden flex items-center"
            style={{ width: collapsed ? 40 : 140, height: 52 }}
          >
            <NextImage
              src="/logo.png"
              alt="Rimba-X"
              width={collapsed ? 80 : 280}
              height={collapsed ? 96 : 336}
              className="w-full object-cover object-top group-hover:scale-105 transition-transform duration-200"
              style={{ marginTop: collapsed ? "-4px" : "-4px" }}
              priority
            />
          </div>
        </Link>
        {/* Desktop collapse button */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            Main Menu
          </p>
        )}
        {mainNavItems.map(renderNavItem)}

        {/* Pending Section */}
        <div className="my-3 border-t border-gray-100" />
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            Pending
          </p>
        )}
        {pendingNavItems.map(renderNavItem)}
      </nav>

      {/* XP Progress (only when expanded) */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3.5 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">
              Level 1
            </span>
            <span className="text-[10px] font-medium text-muted">
              0 / 100 XP
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: "0%" }}
            />
          </div>
        </div>
      )}

      {/* User Area */}
      <div className="border-t border-gray-100 p-3 shrink-0">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5",
            collapsed ? "justify-center" : "",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-md shadow-primary/20">
            {initial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {userName}
              </p>
              <p className="truncate text-xs text-gray-400">{userEmail}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all mt-1",
            collapsed ? "justify-center" : "",
          )}
        >
          <LogOut size={18} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md border border-gray-100 text-gray-600 hover:text-primary transition-colors"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-full flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-out shrink-0",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-3 flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            title="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}
        {sidebarContent}
      </aside>
    </>
  );
}
