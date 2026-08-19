"use client";

import { useEffect, useState } from "react";
import { nestApi } from "@/lib/nest-api";
import { useAuth } from "@/contexts/AuthContext";

type Appointment = {
  id: string;
  /** UTC instants. The clinic-local wall clock is derived for display. */
  startAt: string;
  endAt: string;
  status: string;
  patient: { name: string; email: string | null; phone: string | null };
  doctor: { name: string };
  consultationType: { name: string; durationMinutes: number };
  payment: { amount: string; status: string } | null;
};

/** Renders a UTC instant in the clinic's timezone, not the browser's. */
const CLINIC_TZ = "Africa/Lagos";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: CLINIC_TZ,
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CLINIC_TZ,
  });

export default function ClosedAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = user?.role === "DOCTOR"
          ? await nestApi.getMyAppointments("COMPLETED")
          : await nestApi.getAppointments("COMPLETED");
        setAppointments(res.appointments as Appointment[]);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Completed Appointments</h1>
      <p className="mt-1 text-sm text-slate-500">{appointments.length} completed</p>
      {appointments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No completed appointments.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{apt.patient.name}</p>
                  <p className="text-xs text-slate-500">{apt.patient.email}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">COMPLETED</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <span className="text-xs text-slate-400">Date</span>
                  <p>{fmtDate(apt.startAt)} {fmtTime(apt.startAt)}-{fmtTime(apt.endAt)}</p>
                </div>
                <div><span className="text-xs text-slate-400">Doctor</span><p>{apt.doctor.name}</p></div>
                <div><span className="text-xs text-slate-400">Service</span><p>{apt.consultationType.name}</p></div>
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
