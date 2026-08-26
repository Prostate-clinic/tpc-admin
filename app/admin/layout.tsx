"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Clock,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
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
    { href: "/admin/appointments", label: "Booked Appointments", icon: CalendarDays },
    { href: "/admin/appointments/closed", label: "Closed Appointments", icon: ClipboardCheck },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
  ],
  DOCTOR: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/profile", label: "Profile", icon: User },
    { href: "/admin/appointments", label: "Booked Appointments", icon: CalendarDays },
    { href: "/admin/slots", label: "Manage Slots", icon: Clock },
    {
      href: "/admin/blogs",
      label: "Blogs",
      icon: BookOpen,
      children: [
        { href: "/admin/blogs", label: "All Blogs", icon: Eye },
        { href: "/admin/blogs/my-posts", label: "My Posts", icon: PenLine },
        { href: "/admin/blogs/new", label: "New Post", icon: PlusCircle },
      ],
    },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/profile", label: "Profile", icon: User },
    { href: "/admin/appointments", label: "Booked Appointments", icon: CalendarDays },
    { href: "/admin/appointments/closed", label: "Closed Appointments", icon: ClipboardCheck },
    { href: "/admin/appointments/activity", label: "Activity Log", icon: Eye },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/slots", label: "Manage Slots", icon: Clock },
    {
      href: "/admin/doctors",
      label: "Manage Doctors",
      icon: Users,
      children: [
        { href: "/admin/doctors/create", label: "Create Doctor", icon: PlusCircle },
        { href: "/admin/doctors/manage", label: "Manage Doctors", icon: UserCog },
        { href: "/admin/doctors/recycle-bin", label: "Recycle Bin", icon: Trash2 },
      ],
    },
    {
      href: "/admin/blogs",
      label: "Blogs",
      icon: BookOpen,
      children: [
        { href: "/admin/blogs", label: "All Blogs", icon: Eye },
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
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.role === "DOCTOR" && user.isFirstLogin && pathname !== "/admin/change-password") {
      router.replace("/admin/change-password");
    }
  }, [loading, user, pathname, router]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-sm text-slate-500">Loading...</div></div>;

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-sm text-slate-500">Redirecting...</div></div>;
  }

  if (user.role === "DOCTOR" && user.isFirstLogin && pathname !== "/admin/change-password") {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-sm text-slate-500">Redirecting...</div></div>;
  }

  const items = navItems[user.role] || navItems.FRONTDESK;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link href="/admin" className="text-lg font-bold text-[#1a1aaa]">
            <Image src="/logo.png" alt="Imo Robotic Surgery and Oncology Center" width={80} height={80} className="inline-block" />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1 p-4">
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
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${groupActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {isOpen && (
                    <div className="mt-1 space-y-1 pl-4">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${childActive ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
                          >
                            <ChildIcon className="h-4 w-4" />
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
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-3 px-3">
            <Avatar src={user.image} name={user.name} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between lg:justify-end border-b border-slate-200 bg-white/90 px-5 backdrop-blur">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:block">{user.name}</span>
            <Avatar src={user.image} name={user.name} size={36} />
          </div>
        </header>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
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
