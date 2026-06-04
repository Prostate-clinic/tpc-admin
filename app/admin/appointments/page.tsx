"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi } from "@/lib/nest-api";

type Appointment = {
  id: string; date: string; startTime: string; endTime: string; status: string; notes: string | null;
  patient: { name: string; email: string | null; phone: string | null };
  doctor: { name: string; specialty: string };
  service: { name: string; price: string };
  payment: { amount: string; status: string } | null;
};

export default function BookedAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await nestApi.getAppointments("BOOKED");
      setAppointments(res.appointments as Appointment[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const closeAppointment = async (id: string) => {
    if (!confirm("Close this appointment?")) return;
    try {
      await nestApi.updateAppointment(id, { status: "CLOSED" });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booked Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">{appointments.length} currently booked</p>
        </div>
        <button onClick={load} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Refresh</button>
      </div>

      {appointments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No booked appointments found.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{apt.patient.name}</p>
                  <p className="text-xs text-slate-500">{apt.patient.email} {apt.patient.phone ? `· ${apt.patient.phone}` : ""}</p>
                </div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{apt.status}</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <span className="text-xs text-slate-400">Date & Time</span>
                  <p>{new Date(apt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  <p>{apt.startTime} - {apt.endTime}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Doctor</span>
                  <p>{apt.doctor.name}</p>
                  <p className="text-xs">{apt.doctor.specialty}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Service</span>
                  <p>{apt.service.name}</p>
                </div>
              </div>
              {apt.payment && (
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Payment: ₦{Number(apt.payment.amount).toLocaleString()} ✓
                </span>
              )}
              <div className="mt-3 flex justify-end">
                <button onClick={() => closeAppointment(apt.id)}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                  Close Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
