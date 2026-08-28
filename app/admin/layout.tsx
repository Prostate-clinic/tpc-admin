"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  Clock,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PenLine,
  PlusCircle,
  User,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Avatar from "@/components/Avatar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
};

const navItems: Record<string, NavItem[]> = {
  FRONTDESK: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/profile", label: "Profile", icon: User },
    { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/admin/appointments/closed", label: "Closed", icon: ClipboardCheck },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
  ],
  DOCTOR: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/profile", label: "Profile", icon: User },
    { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/admin/slots", label: "My Schedule", icon: Clock },
    {
      href: "/admin/blogs",
      label: "Blog",
      icon: BookOpen,
      children: [
        { href: "/admin/blogs", label: "All Posts", icon: Eye },
        { href: "/admin/blogs/my-posts", label: "My Posts", icon: PenLine },
        { href: "/admin/blogs/new", label: "New Post", icon: PlusCircle },
      ],
    },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/profile", label: "Profile", icon: User },
    { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/admin/appointments/closed", label: "Closed", icon: ClipboardCheck },
    { href: "/admin/appointments/activity", label: "Activity", icon: Eye },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/services", label: "Services", icon: Package },
    { href: "/admin/slots", label: "Schedule", icon: Clock },
    {
      href: "/admin/doctors",
      label: "Doctors",
      icon: Users,
      children: [
        { href: "/admin/doctors/create", label: "Add Doctor", icon: PlusCircle },
        { href: "/admin/doctors/manage", label: "Manage", icon: UserCog },
        { href: "/admin/doctors/recycle-bin", label: "Recycle Bin", icon: Trash2 },
      ],
    },
    {
      href: "/admin/blogs",
      label: "Blog",
      icon: BookOpen,
      children: [
        { href: "/admin/blogs", label: "All Posts", icon: Eye },
        { href: "/admin/blogs/my-posts", label: "My Posts", icon: PenLine },
        { href: "/admin/blogs/new", label: "New Post", icon: PlusCircle },
      ],
    },
  ],
};

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => ({
    "/admin/doctors": pathname.startsWith("/admin/doctors"),
    "/admin/blogs": pathname.startsWith("/admin/blogs"),
  }));

  const toggleMenu = (key: string) => setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    setOpenMenus((prev) => ({
      ...prev,
      "/admin/doctors": prev["/admin/doctors"] || pathname.startsWith("/admin/doctors"),
      "/admin/blogs": prev["/admin/blogs"] || pathname.startsWith("/admin/blogs"),
    }));
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.role === "DOCTOR" && user.isFirstLogin && pathname !== "/admin/change-password") {
      router.replace("/admin/change-password");
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100"><span className="text-sm text-slate-500">Redirecting...</span></div>;
  }

  if (user.role === "DOCTOR" && user.isFirstLogin && pathname !== "/admin/change-password") {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100"><span className="text-sm text-slate-500">Redirecting...</span></div>;
  }

  const items = navItems[user.role] || navItems.FRONTDESK;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Fixed Sidebar — full height, left edge */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-100 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
            <Image src="/logo.png" alt="" width={18} height={18} className="rounded" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">TPC Admin</p>
            <p className="truncate text-[10px] font-medium text-slate-400">Management Portal</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden">
            <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            if (item.children?.length) {
              const groupActive = pathname.startsWith(item.href);
              const isOpen = !!openMenus[item.href];
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.href)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${groupActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-0.5 ml-4 space-y-0.5 border-l-2 border-slate-100 pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = pathname === child.href;
                        return (
                          <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition ${childActive ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
                            <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
            <Avatar src={user.image} name={user.name} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Fixed Header — flush with sidebar, full width remaining */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5 transition-[left] duration-200 lg:left-60 lg:justify-end">
        <button onClick={() => setSidebarOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 sm:flex">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">Online</span>
          </div>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{user.name}</span>
            <Avatar src={user.image} name={user.name} size={32} />
          </div>
        </div>
      </header>

      {/* Main content — offset for sidebar + header, padded */}
      <div className="min-h-screen pt-14 transition-[padding-left] duration-200 lg:pl-60">
        <main className="">{children}</main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
