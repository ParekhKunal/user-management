"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  GitFork,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Shield,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/usePlatform";
import { canManageUsers, hasPermission, isSuperAdmin, roleLabel } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import { Brand } from "@/components/layout/Brand";
import { Avatar, Button } from "@/components/ui/primitives";
import type { Permission, User } from "@/types/user";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  show: (user: User) => boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function visible(permission: Permission) {
  return (user: User) => hasPermission(user, permission);
}

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: () => true }],
  },
  {
    label: "People",
    items: [
      {
        href: "/employees",
        label: "Employees",
        icon: UsersRound,
        show: (user) => hasPermission(user, "employees.read") && user.role !== "employee" && user.role !== "user",
      },
      { href: "/departments", label: "Departments", icon: Building2, show: visible("departments.read") },
      { href: "/teams", label: "Teams", icon: Users, show: visible("teams.read") },
    ],
  },
  {
    label: "Requests",
    items: [
      {
        href: "/leaves",
        label: "Leave",
        icon: CalendarDays,
        show: (user) => hasPermission(user, "leave.read") && (user.role === "manager" || user.role === "hr-manager" || user.role === "admin" || user.role === "super-admin"),
      },
      {
        href: "/attendance",
        label: "Attendance",
        icon: Clock3,
        show: (user) => hasPermission(user, "attendance.read") && (user.role === "manager" || user.role === "hr-manager" || user.role === "admin" || user.role === "super-admin"),
      },
    ],
  },
  {
    label: "Organization",
    items: [{ href: "/organization", label: "Structure", icon: GitFork, show: visible("departments.read") }],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "Users", icon: Users, show: (user) => canManageUsers(user.role) },
      { href: "/roles", label: "Role permissions", icon: Shield, show: isSuperAdmin },
      { href: "/permissions", label: "Permissions", icon: ClipboardList, show: isSuperAdmin },
      { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, show: visible("audit.read") },
      { href: "/settings", label: "Settings", icon: Settings, show: visible("settings.read") },
    ],
  },
  {
    label: "My Workspace",
    items: [
      { href: "/profile", label: "Profile", icon: UserRound, show: () => true },
      { href: "/my-attendance", label: "Attendance", icon: Clock3, show: visible("attendance.read") },
      { href: "/my-leave", label: "Leave", icon: CalendarDays, show: visible("leave.read") },
      { href: "/notifications", label: "Notifications", icon: Bell, show: () => true },
    ],
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const notifications = useNotifications(Boolean(user));

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && pathname.startsWith("/users") && !canManageUsers(user.role)) {
      router.replace("/dashboard");
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      (pathname.startsWith("/roles") || pathname.startsWith("/permissions")) &&
      !isSuperAdmin(user)
    ) {
      router.replace("/dashboard");
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const visibleGroups = useMemo(() => {
    if (!user) return [];
    return groups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.show(user)) }))
      .filter((group) => group.items.length > 0);
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas text-mute">
        <span className="mb-4 h-px w-10 bg-gold/50" />
        <p className="text-2xl font-semibold text-ink">Opening the desk</p>
        <p className="mt-2 text-sm">Checking your session…</p>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const unread = notifications.data?.unreadCount ?? 0;

  const navigation = (
    <nav className="space-y-6">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-mute">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors duration-150",
                    active ? "bg-gold/10 text-ink" : "text-mute hover:bg-canvas hover:text-ink"
                  )}
                >
                  <span className={cn("h-4 w-0.5 rounded-full", active ? "bg-gold" : "bg-transparent")} />
                  <Icon className={cn("h-4 w-4", active ? "text-gold" : "text-mute")} strokeWidth={1.6} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/notifications" && unread > 0 ? (
                    <span className="rounded-full bg-gold px-1.5 text-[10px] font-medium text-white">{unread}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-line bg-raised px-5 py-6 lg:flex">
        <Brand />
        <div className="mt-8 flex-1 overflow-y-auto pr-1">{navigation}</div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-3">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-mute">
              {roleLabel(user.role)}
            </p>
          </div>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[260px] flex-col border-r border-line bg-raised px-5 py-6">
            <div className="mb-8 flex items-center justify-between">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} className="text-mute hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{navigation}</div>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-raised/85 px-5 py-3.5 backdrop-blur-md sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-md p-1.5 text-mute hover:bg-canvas hover:text-ink lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mute">Signed in</p>
              <p className="truncate text-sm text-ink">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative rounded-md p-2 text-mute hover:bg-canvas hover:text-ink"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold" /> : null}
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                void handleLogout();
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </header>
        <main className="px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
