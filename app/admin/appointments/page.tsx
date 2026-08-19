"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi } from "@/lib/nest-api";

type Appointment = {
  id: string;
  /** UTC instants. The clinic-local wall clock is derived for display. */
  startAt: string;
  endAt: string;
  status: string;
  patient: { name: string; email: string | null; phone: string | null };
  doctor: { name: string; specialty: string };
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

export default function BookedAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = user?.role === "DOCTOR" ? await nestApi.getMyAppointments("CONFIRMED") : await nestApi.getAppointments("CONFIRMED");
      setAppointments(res.appointments as Appointment[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  // "Close" is now COMPLETED — the consultation happened. A patient who never
  // turned up is NO_SHOW, which the old single CLOSED status silently lost.
  const completeAppointment = async (id: string) => {
    if (!confirm("Mark this appointment as completed?")) return;
    try {
      await nestApi.updateAppointmentStatus(id, "COMPLETED");
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not complete appointment");
    }
  };

  const markNoShow = async (id: string) => {
    if (!confirm("Mark this patient as a no-show?")) return;
    try {
      await nestApi.updateAppointmentStatus(id, "NO_SHOW");
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not mark no-show");
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
                  <p>{fmtDate(apt.startAt)}</p>
                  <p>{fmtTime(apt.startAt)} - {fmtTime(apt.endAt)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Doctor</span>
                  <p>{apt.doctor.name}</p>
                  <p className="text-xs">{apt.doctor.specialty}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Service</span>
                  <p>{apt.consultationType.name}</p>
                </div>
              </div>
              {apt.payment && (
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Payment: ₦{Number(apt.payment.amount).toLocaleString()} ✓
                </span>
              )}
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => markNoShow(apt.id)}
                  className="rounded-full border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">
                  No Show
                </button>
                <button onClick={() => completeAppointment(apt.id)}
                  className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                  Mark Completed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
