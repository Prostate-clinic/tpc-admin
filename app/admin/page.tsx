"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { CalendarDays, ClipboardCheck, CreditCard, Clock } from "lucide-react";
import Link from "next/link";
import { nestApi } from "@/lib/nest-api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ booked: 0, completed: 0, payments: 0, workingDays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // CLOSED is gone. It conflated "the consultation happened" with "we
        // stopped tracking it" — COMPLETED is the honest replacement, and
        // NO_SHOW / CANCELLED now carry the outcomes it used to hide.
        const [bookedRes, completedRes] = await Promise.all([
          user?.role === "DOCTOR"
            ? nestApi.getMyAppointments("CONFIRMED")
            : nestApi.getAppointments("CONFIRMED"),
          user?.role === "DOCTOR"
            ? nestApi.getMyAppointments("COMPLETED")
            : nestApi.getAppointments("COMPLETED"),
        ]);

        const booked = bookedRes.appointments?.length || 0;
        const completed = completedRes.appointments?.length || 0;

        let payments = 0;
        if (user?.role !== "DOCTOR") {
          const pRes = await nestApi.getPayments();
          payments = pRes.payments?.length || 0;
        }

        // "Open slots" is no longer a countable thing: slots are computed per
        // consultation type per day, so the number depends on what you are
        // asking about. The meaningful figure a doctor can act on is how many
        // days a week they have declared themselves available.
        let workingDays = 0;
        if (user?.role === "DOCTOR") {
          const { schedule } = await nestApi.getWeeklySchedule();
          workingDays = new Set(schedule.map((block) => block.dayOfWeek)).size;
        }

        setStats({ booked, completed, payments, workingDays });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const cards = [
    { label: "Booked Appointments", value: stats.booked, icon: CalendarDays, color: "bg-indigo-50 text-indigo-700", href: "/admin/appointments", show: true },
    { label: "Completed Appointments", value: stats.completed, icon: ClipboardCheck, color: "bg-emerald-50 text-emerald-700", href: "/admin/appointments/closed", show: user?.role !== "DOCTOR" },
    { label: "Payments Received", value: stats.payments, icon: CreditCard, color: "bg-amber-50 text-amber-700", href: "/admin/payments", show: user?.role !== "DOCTOR" },
    { label: "Working Days / Week", value: stats.workingDays, icon: Clock, color: "bg-cyan-50 text-cyan-700", href: "/admin/slots", show: user?.role === "DOCTOR" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back, {user?.name}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.filter((c) => c.show).map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
              <div className={`inline-flex rounded-xl p-2.5 ${card.color}`}><Icon className="h-5 w-5" /></div>
              <p className="mt-4 text-2xl font-bold text-slate-900">{loading ? "..." : card.value}</p>
              <p className="mt-1 text-sm text-slate-500">{card.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
