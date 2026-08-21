"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi, AppointmentStatus } from "@/lib/nest-api";

type Appointment = {
  id: string;
  referenceNumber: string;
  /** UTC instants. The clinic-local wall clock is derived for display. */
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  /** Null for guest bookings — the contact fields below are always present. */
  patient: { name: string; email: string | null; phone: string | null } | null;
  doctor: { name: string; specialty: string };
  consultationType: { name: string; durationMinutes: number };
  payment: { amount: string; status: string } | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
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

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  CHECKED_IN: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-rose-100 text-rose-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
};

// A booking is PENDING (a 30-minute payment hold) until payment or staff
// approval moves it on — so "Active" is the working set, and the other tabs
// exist because cancelled and missed appointments are information too.
const TABS: { label: string; statuses?: AppointmentStatus[] }[] = [
  { label: "Active", statuses: ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"] },
  { label: "Pending", statuses: ["PENDING"] },
  { label: "Confirmed", statuses: ["CONFIRMED"] },
  { label: "Completed", statuses: ["COMPLETED"] },
  { label: "Cancelled", statuses: ["CANCELLED"] },
  { label: "No-shows", statuses: ["NO_SHOW"] },
  { label: "Rejected", statuses: ["REJECTED"] },
  { label: "All" },
];

export default function BookedAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const statuses = TABS[tab].statuses;
      const res =
        user?.role === "DOCTOR"
          ? await nestApi.getMyAppointments(statuses)
          : await nestApi.getAppointments(statuses);
      setAppointments(res.appointments as Appointment[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, tab]);

  const confirmAppointment = async (id: string) => {
    if (!confirm("Confirm this appointment?")) return;
    try {
      await nestApi.confirmAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CONFIRMED" } : a)),
      );
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not confirm appointment");
    }
  };

  const cancelAppointment = async (id: string) => {
    const reason = prompt("Reason for cancelling (shared with the patient):");
    if (reason === null) return;
    try {
      await nestApi.cancelAppointment(id, reason || undefined, true);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not cancel appointment");
    }
  };

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booked Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">{appointments.length} appointment{appointments.length === 1 ? "" : "s"} · {TABS[tab].label.toLowerCase()}</p>
        </div>
        <button onClick={load} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Refresh</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setTab(i)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === i
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading...</p>
      ) : appointments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No appointments found.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((apt) => {
            // A guest booking has no patient row; the contact fields are the
            // identity the appointment was actually made under.
            const name = apt.patient?.name ?? apt.contactName;
            const email = apt.patient?.email ?? apt.contactEmail;
            const phone = apt.patient?.phone ?? apt.contactPhone;
            return (
            <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">{email} {phone ? `· ${phone}` : ""}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">Ref: {apt.referenceNumber}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[apt.status] ?? "bg-slate-100 text-slate-700"}`}>{apt.status.replace(/_/g, " ")}</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <span className="text-xs text-slate-400">Date & Time</span>
                  <p>{fmtDate(apt.startAt)}</p>
                  <p>{fmtTime(apt.startAt)} - {fmtTime(apt.endAt)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Doctor</span>
                  <p>{apt.doctor?.name ?? "—"}</p>
                  <p className="text-xs">{apt.doctor?.specialty}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Service</span>
                  <p>{apt.consultationType.name}</p>
                </div>
              </div>

              {(apt.status === "CANCELLED" || apt.status === "REJECTED") && (
                <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {apt.status === "CANCELLED" ? "Cancelled" : "Rejected"}
                  {apt.cancelledAt ? ` on ${fmtDate(apt.cancelledAt)}` : ""}
                  {apt.cancellationReason ? ` — ${apt.cancellationReason}` : ""}
                </p>
              )}
              {apt.notes && (
                <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-medium">Patient note:</span> {apt.notes}
                </p>
              )}

              {apt.payment && (
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Payment: ₦{Number(apt.payment.amount).toLocaleString()} ✓
                </span>
              )}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {apt.status === "PENDING" && (
                  <>
                    <button onClick={() => cancelAppointment(apt.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50">
                      Cancel
                    </button>
                    <button onClick={() => confirmAppointment(apt.id)}
                      className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
                      Confirm
                    </button>
                  </>
                )}
                {apt.status === "CONFIRMED" && (
                  <>
                    <button onClick={() => cancelAppointment(apt.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50">
                      Cancel
                    </button>
                    <button onClick={() => markNoShow(apt.id)}
                      className="rounded-full border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">
                      No Show
                    </button>
                  </>
                )}
                {(apt.status === "CONFIRMED" || apt.status === "CHECKED_IN" || apt.status === "IN_PROGRESS") && (
                  <button onClick={() => completeAppointment(apt.id)}
                    className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
