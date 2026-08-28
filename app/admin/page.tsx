"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { CalendarDays, ClipboardCheck, CreditCard, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { nestApi } from "@/lib/nest-api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ booked: 0, completed: 0, payments: 0, workingDays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [bookedRes, completedRes] = await Promise.all([
          user?.role === "DOCTOR" ? nestApi.getMyAppointments("CONFIRMED") : nestApi.getAppointments({ status: "CONFIRMED" }),
          user?.role === "DOCTOR" ? nestApi.getMyAppointments("COMPLETED") : nestApi.getAppointments({ status: "COMPLETED" }),
        ]);
        const booked = bookedRes.appointments?.length || 0;
        const completed = completedRes.appointments?.length || 0;
        let payments = 0;
        if (user?.role !== "DOCTOR") {
          const pRes = await nestApi.getPayments();
          payments = pRes.payments?.length || 0;
        }
        let workingDays = 0;
        if (user?.role === "DOCTOR") {
          const { schedule } = await nestApi.getWeeklySchedule();
          workingDays = new Set(schedule.map((block) => block.dayOfWeek)).size;
        }
        setStats({ booked, completed, payments, workingDays });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const cards = [
    { label: "Booked Appointments", value: stats.booked, icon: CalendarDays, color: "from-indigo-500 to-indigo-600", href: "/admin/appointments", show: true },
    { label: "Completed", value: stats.completed, icon: ClipboardCheck, color: "from-emerald-500 to-emerald-600", href: "/admin/appointments/closed", show: user?.role !== "DOCTOR" },
    { label: "Payments", value: stats.payments, icon: CreditCard, color: "from-amber-500 to-amber-600", href: "/admin/payments", show: user?.role !== "DOCTOR" },
    { label: "Working Days", value: stats.workingDays, icon: Clock, color: "from-cyan-500 to-cyan-600", href: "/admin/slots", show: user?.role === "DOCTOR" },
  ];

  return (
    <div className="animate-fade-up p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{greeting()}, {user?.name?.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening with your clinic today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.filter((c) => c.show).map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50">
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-lg shadow-indigo-100/50`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </div>
              <div className="mt-5">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-slate-100" /> : card.value}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">{card.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "View Appointments", href: "/admin/appointments" },
              { label: "Manage Schedule", href: "/admin/slots" },
              ...(user?.role === "ADMIN" ? [{ label: "Add New Doctor", href: "/admin/doctors/create" }] : []),
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:border-slate-200 hover:bg-slate-50">
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Account Details</h3>
          <div className="space-y-2">
            {[
              { label: "Name", value: user?.name },
              { label: "Email", value: user?.email },
              { label: "Role", value: user?.role },
            ].map((detail) => (
              <div key={detail.label} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                <span className="text-sm text-slate-500">{detail.label}</span>
                <span className="text-sm font-medium text-slate-700">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
