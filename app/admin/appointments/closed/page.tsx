"use client";

import { useEffect, useState } from "react";
import { nestApi } from "@/lib/nest-api";

type Appointment = {
  id: string; date: string; startTime: string; endTime: string; status: string;
  patient: { name: string; email: string | null; phone: string | null };
  doctor: { name: string }; service: { name: string };
  payment: { amount: string; status: string } | null;
};

export default function ClosedAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await nestApi.getAppointments("CLOSED");
        setAppointments(res.appointments as Appointment[]);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Closed Appointments</h1>
      <p className="mt-1 text-sm text-slate-500">{appointments.length} completed</p>
      {appointments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No closed appointments.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{apt.patient.name}</p>
                  <p className="text-xs text-slate-500">{apt.patient.email}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">CLOSED</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <span className="text-xs text-slate-400">Date</span>
                  <p>{new Date(apt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {apt.startTime}-{apt.endTime}</p>
                </div>
                <div><span className="text-xs text-slate-400">Doctor</span><p>{apt.doctor.name}</p></div>
                <div><span className="text-xs text-slate-400">Service</span><p>{apt.service.name}</p></div>
              </div>
              {apt.payment && (
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">₦{Number(apt.payment.amount).toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
