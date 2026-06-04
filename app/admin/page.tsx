"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { CalendarDays, ClipboardCheck, CreditCard, Clock } from "lucide-react";
import Link from "next/link";
import { nestApi } from "@/lib/nest-api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ booked: 0, closed: 0, payments: 0, slots: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [bookedRes, closedRes] = await Promise.all([
          nestApi.getAppointments("BOOKED"),
          nestApi.getAppointments("CLOSED"),
        ]);
        const booked = bookedRes.appointments?.length || 0;
        const closed = closedRes.appointments?.length || 0;

        let payments = 0;
        if (user?.role !== "DOCTOR") {
          const pRes = await nestApi.getPayments();
          payments = pRes.payments?.length || 0;
        }

        let slots = 0;
        if (user?.role === "DOCTOR" && user.doctorId) {
          const sRes = await nestApi.getSlots(user.doctorId);
          slots = sRes.slots?.length || 0;
        }

        setStats({ booked, closed, payments, slots });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, [user]);

  const cards = [
    { label: "Booked Appointments", value: stats.booked, icon: CalendarDays, color: "bg-indigo-50 text-indigo-700", href: "/admin/appointments", show: true },
    { label: "Closed Appointments", value: stats.closed, icon: ClipboardCheck, color: "bg-emerald-50 text-emerald-700", href: "/admin/appointments/closed", show: user?.role !== "DOCTOR" },
    { label: "Payments Received", value: stats.payments, icon: CreditCard, color: "bg-amber-50 text-amber-700", href: "/admin/payments", show: user?.role !== "DOCTOR" },
    { label: "Open Slots", value: stats.slots, icon: Clock, color: "bg-cyan-50 text-cyan-700", href: "/admin/slots", show: user?.role === "DOCTOR" || user?.role === "ADMIN" },
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
