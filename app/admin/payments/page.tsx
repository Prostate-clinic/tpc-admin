"use client";

import { useEffect, useState } from "react";
import { nestApi } from "@/lib/nest-api";

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
      try {
        const res = await nestApi.getPayments();
        setPayments(res.payments as Payment[]);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">{payments.length} recorded</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-4 py-2 text-right">
          <p className="text-xs text-emerald-600">Total Revenue</p>
          <p className="text-lg font-bold text-emerald-800">₦{total.toLocaleString()}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No payments recorded.</div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="pb-3 font-semibold">Patient</th>
                <th className="pb-3 font-semibold">Service</th>
                <th className="pb-3 font-semibold">Doctor</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-3"><p className="font-medium text-slate-900">{p.appointment.patient.name}</p><p className="text-xs text-slate-500">{p.appointment.patient.email}</p></td>
                  <td className="py-3 text-slate-700">{p.appointment.service.name}</td>
                  <td className="py-3 text-slate-700">{p.appointment.doctor.name}</td>
                  <td className="py-3 text-slate-700">{new Date(p.appointment.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td className="py-3 text-right font-semibold text-slate-900">₦{Number(p.amount).toLocaleString()}</td>
                  <td className="py-3 text-right"><span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
