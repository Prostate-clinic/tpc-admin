"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi, AppointmentStatus, PaginationMeta } from "@/lib/nest-api";
import Pager from "@/components/Pager";
import { RefreshCw, Clock, User, Stethoscope, AlertCircle } from "lucide-react";

type Appointment = {
  id: string;
  referenceNumber: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  patient: { name: string; email: string | null; phone: string | null } | null;
  doctor: { name: string; specialty: string };
  consultationType: { name: string; durationMinutes: number };
  payment: { amount: string; status: string } | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
};

const CLINIC_TZ = "Africa/Lagos";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: CLINIC_TZ });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CLINIC_TZ });

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  CHECKED_IN: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-rose-100 text-rose-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
};

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
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const statuses = TABS[tab].statuses;
      const res = user?.role === "DOCTOR"
        ? await nestApi.getMyAppointments(statuses, page)
        : await nestApi.getAppointments(statuses, page);
      setAppointments(res.appointments as Appointment[]);
      setPagination(res.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, tab, page]);

  const selectTab = (i: number) => { setTab(i); setPage(1); };

  const confirmAppointment = async (id: string) => {
    if (!confirm("Confirm this appointment?")) return;
    try { await nestApi.confirmAppointment(id); setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "CONFIRMED" } : a))); }
    catch (e) { alert(e instanceof Error ? e.message : "Could not confirm"); }
  };

  const cancelAppointment = async (id: string) => {
    const reason = prompt("Reason for cancelling:");
    if (reason === null) return;
    try { await nestApi.cancelAppointment(id, reason || undefined, true); setAppointments((prev) => prev.filter((a) => a.id !== id)); }
    catch (e) { alert(e instanceof Error ? e.message : "Could not cancel"); }
  };

  const completeAppointment = async (id: string) => {
    if (!confirm("Mark as completed?")) return;
    try { await nestApi.updateAppointmentStatus(id, "COMPLETED"); setAppointments((prev) => prev.filter((a) => a.id !== id)); }
    catch (e) { alert(e instanceof Error ? e.message : "Could not complete"); }
  };

  const markNoShow = async (id: string) => {
    if (!confirm("Mark as no-show?")) return;
    try { await nestApi.updateAppointmentStatus(id, "NO_SHOW"); setAppointments((prev) => prev.filter((a) => a.id !== id)); }
    catch (e) { alert(e instanceof Error ? e.message : "Could not mark no-show"); }
  };

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booked Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pagination ? pagination.total : appointments.length} appointment{(pagination?.total ?? appointments.length) === 1 ? "" : "s"} &middot; {TABS[tab].label.toLowerCase()}
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t, i) => (
          <button key={t.label} onClick={() => selectTab(i)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${tab === i ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-2 h-3 w-48 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <AlertCircle className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, idx) => {
            const name = apt.patient?.name ?? apt.contactName;
            const email = apt.patient?.email ?? apt.contactEmail;
            const phone = apt.patient?.phone ?? apt.contactPhone;
            return (
              <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-100 animate-fade-up" style={{ animationDelay: `${idx * 0.04}s` } as React.CSSProperties}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-400">{email}{phone ? ` · ${phone}` : ""}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">Ref: {apt.referenceNumber}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[apt.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {apt.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3 border-t border-slate-100 pt-4">
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Date & Time</p>
                      <p className="font-medium text-slate-700">{fmtDate(apt.startAt)}</p>
                      <p className="text-slate-500">{fmtTime(apt.startAt)} &ndash; {fmtTime(apt.endAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Doctor</p>
                      <p className="font-medium text-slate-700">{apt.doctor?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{apt.doctor?.specialty}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Service</p>
                    <p className="font-medium text-slate-700">{apt.consultationType.name}</p>
                  </div>
                </div>

                {(apt.status === "CANCELLED" || apt.status === "REJECTED") && (
                  <div className="mt-3 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
                    {apt.status === "CANCELLED" ? "Cancelled" : "Rejected"}
                    {apt.cancelledAt ? ` on ${fmtDate(apt.cancelledAt)}` : ""}
                    {apt.cancellationReason ? ` — ${apt.cancellationReason}` : ""}
                  </div>
                )}

                {apt.notes && (
                  <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
                    <span className="font-semibold">Note:</span> {apt.notes}
                  </div>
                )}

                {apt.payment && (
                  <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Paid ₦{Number(apt.payment.amount).toLocaleString()}
                  </span>
                )}

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                  {apt.status === "PENDING" && (
                    <>
                      <button onClick={() => cancelAppointment(apt.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50">Cancel</button>
                      <button onClick={() => confirmAppointment(apt.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700">Confirm</button>
                    </>
                  )}
                  {apt.status === "CONFIRMED" && (
                    <>
                      <button onClick={() => cancelAppointment(apt.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50">Cancel</button>
                      <button onClick={() => markNoShow(apt.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50">No Show</button>
                    </>
                  )}
                  {(apt.status === "CONFIRMED" || apt.status === "CHECKED_IN" || apt.status === "IN_PROGRESS") && (
                    <button onClick={() => completeAppointment(apt.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700">Completed</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pager pagination={pagination} onPage={setPage} />
    </div>
  );
}
