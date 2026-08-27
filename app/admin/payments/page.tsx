"use client";

import { useEffect, useState } from "react";
import { nestApi } from "@/lib/nest-api";
import { TrendingUp, AlertCircle } from "lucide-react";

type Payment = {
  id: string; amount: string; status: string; createdAt: string;
  appointment: {
    date: string; patient: { name: string; email: string | null };
    doctor: { name: string }; service: { name: string };
  };
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await nestApi.getPayments(); setPayments(res.payments as Payment[]); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">{payments.length} payment{payments.length === 1 ? "" : "s"} recorded</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Revenue</p>
            <p className="text-xl font-bold text-emerald-600">₦{total.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16">
          <AlertCircle className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">No payments recorded</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Doctor</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 text-right font-semibold">Amount</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{p.appointment.patient?.name ?? "Guest"}</p>
                    <p className="text-xs text-slate-400">{p.appointment.patient?.email ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.appointment.service?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{p.appointment.doctor?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{new Date(p.appointment.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">₦{Number(p.amount).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
