"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi, AppointmentStatus, PaginationMeta } from "@/lib/nest-api";
import Pager from "@/components/Pager";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import {
  RefreshCw, User, AlertCircle, ChevronRight, CalendarPlus, X,
  Paperclip, StickyNote, CreditCard, DollarSign,
} from "lucide-react";

type ActionDialog =
  | { kind: "confirm"; id: string }
  | { kind: "cancel"; id: string }
  | { kind: "complete"; id: string }
  | { kind: "noshow"; id: string }
  | null;

type Brief = {
  id: string;
  referenceNumber: string;
  createdAt: string;
  startAt: string;
  endAt: string;
  status: string;
  patient: { name: string; email: string | null; phone: string | null } | null;
  doctor: { name: string; specialty: string | null } | null;
  consultationType: { name: string; durationMinutes: number };
  payment: { amount: string; status: string; reference?: string | null } | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
};

type Detail = Brief & {
  service: { name: string } | null;
  medicalNoteUrl: string | null;
  notes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  checkedInAt: string | null;
  startedAt: string | null;
  branch: { name: string } | null;
};

type TabDef = {
  label: string;
  statuses?: AppointmentStatus[];
  assigned?: "yes" | "no";
  paymentStatus?: "AWAITING" | "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
};

const CLINIC_TZ = "Africa/Lagos";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: CLINIC_TZ });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CLINIC_TZ });
const fmtDateShort = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: CLINIC_TZ });

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

/** Still on a patient's calendar (not completed/cancelled). */
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"];

const TABS: TabDef[] = [
  { label: "Awaiting Payment", statuses: ["PENDING"], paymentStatus: "AWAITING" },
  { label: "Unassigned", statuses: ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"], assigned: "no" },
  { label: "Assigned", statuses: ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"], assigned: "yes" },
  { label: "Completed", statuses: ["COMPLETED"] },
  { label: "Cancelled", statuses: ["CANCELLED", "REJECTED", "NO_SHOW"] },
  { label: "All" },
];

export default function BookedAppointmentsPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === "DOCTOR";
  const canAssign = user?.role === "ADMIN" || user?.role === "FRONTDESK";
  const visibleTabs = isDoctor
    ? TABS.filter((t) => t.label === "Assigned" || t.label === "Completed" || t.label === "Cancelled")
    : TABS;

  const [appointments, setAppointments] = useState<Brief[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [assigning, setAssigning] = useState(false);

  const [selected, setSelected] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [dialog, setDialog] = useState<ActionDialog>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const t = visibleTabs[tab] ?? visibleTabs[0];
      let res: { appointments: unknown[]; pagination: PaginationMeta };
      if (isDoctor) {
        res = await nestApi.getMyAppointments(t.statuses, page);
      } else {
        res = await nestApi.getAppointments({ status: t.statuses, assigned: t.assigned, paymentStatus: t.paymentStatus, page });
      }
      setAppointments(res.appointments as Brief[]);
      setPagination(res.pagination);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDoctor && tab >= visibleTabs.length) {
      setTab(0);
      return;
    }
    load();
    if (canAssign) {
      nestApi.getAssignableDoctors()
        .then((r) => setDoctors((r.doctors || []).map((d) => ({ id: d.id, name: d.name }))))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab, page, visibleTabs.length]);

  const selectTab = (i: number) => { setTab(i); setPage(1); };

  const openDetail = async (id: string) => {
    setSelected(null);
    setDetailLoading(true);
    try {
      const res = await nestApi.getAppointment(id);
      setSelected(res.appointment as Detail);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not load appointment detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const reloadDetail = async () => {
    if (!selected) return;
    try {
      const res = await nestApi.getAppointment(selected.id);
      setSelected(res.appointment as Detail);
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not reload");
    }
  };

  const runAction = async (action: () => Promise<void>, fallback: string) => {
    setActionBusy(true);
    setActionError("");
    try {
      await action();
      setDialog(null);
      setCancelReason("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : fallback);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmed = async (id: string) => {
    await runAction(async () => {
      await nestApi.confirmAppointment(id);
      await reloadDetail();
    }, "Could not confirm");
  };

  const cancelOne = async (id: string) => {
    await runAction(async () => {
      await nestApi.cancelAppointment(id, cancelReason.trim() || undefined, true);
      await reloadDetail();
    }, "Could not cancel");
  };

  const completeOne = async (id: string) => {
    await runAction(async () => {
      await nestApi.updateAppointmentStatus(id, "COMPLETED");
      await reloadDetail();
    }, "Could not complete");
  };

  const markNoShow = async (id: string) => {
    await runAction(async () => {
      await nestApi.updateAppointmentStatus(id, "NO_SHOW");
      await reloadDetail();
    }, "Could not mark no-show");
  };

  const assignDoc = async (doctorId: string) => {
    if (!selected || !doctorId) return;
    setAssigning(true);
    try { await nestApi.assignDoctor(selected.id, doctorId); await reloadDetail(); }
    catch (e) { setToast(e instanceof Error ? `Could not assign: ${e.message}` : "Could not assign doctor"); }
    finally { setAssigning(false); }
  };

  const closeDialog = () => {
    if (actionBusy) return;
    setDialog(null);
    setActionError("");
    setCancelReason("");
  };

  return (
    <div className="animate-fade-up h-screen relative p-4 lg:p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pagination ? pagination.total : appointments.length} appointment{(pagination?.total ?? appointments.length) === 1 ? "" : "s"} &middot; {(visibleTabs[tab] ?? visibleTabs[0]).label.toLowerCase()}
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {visibleTabs.map((t, i) => (
          <button key={t.label} onClick={() => selectTab(i)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${tab === i ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <AlertCircle className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span className="col-span-3">Patient</span>
            <span className="col-span-2">Reference</span>
            <span className="col-span-2">Date booked</span>
            <span className="col-span-2">Email</span>
            <span className="col-span-2">Phone</span>
            <span className="col-span-1 text-right">Status</span>
          </div>
          {appointments.map((apt) => {
            const name = apt.patient?.name ?? apt.contactName;
            const email = apt.patient?.email ?? apt.contactEmail;
            const phone = apt.patient?.phone ?? apt.contactPhone;
            return (
              <button key={apt.id} onClick={() => openDetail(apt.id)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40">
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-x-4 gap-y-1 items-center">
                  <span className="col-span-2 sm:col-span-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100"><User className="h-4 w-4 text-slate-500" /></span>
                    <span className="font-semibold text-slate-900 truncate">{name}</span>
                  </span>
                  <span className="col-span-2 sm:col-span-2 font-mono text-xs text-slate-500 truncate">{apt.referenceNumber}</span>
                  <span className="col-span-2 sm:col-span-2 text-sm text-slate-600">{fmtDateShort(apt.createdAt)}</span>
                  <span className="col-span-2 sm:col-span-2 text-sm text-slate-600 truncate">{email}</span>
                  <span className="col-span-2 sm:col-span-2 text-sm text-slate-600 truncate">{phone ?? "—"}</span>
                  <span className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[apt.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {apt.status.replace(/_/g, " ")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Pager pagination={pagination} onPage={setPage} />

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/40 backdrop-blur-2xl p-4 sm:p-8" onClick={() => setSelected(null)}>
          <div className="m-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Appointment details</h2>
                <p className="font-mono text-xs text-slate-400">Ref: {selected.referenceNumber}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-slate-900">{selected.patient?.name ?? selected.contactName}</p>
                  <p className="text-sm text-slate-500">{selected.patient?.email ?? selected.contactEmail}{selected.patient?.phone ?? selected.contactPhone ? ` · ${selected.patient?.phone ?? selected.contactPhone}` : ""}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[selected.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {selected.status.replace(/_/g, " ")}
                </span>
              </div>

              <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date booked</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{fmtDate(selected.createdAt)} · {fmtTime(selected.createdAt)}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Appointment</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{fmtDate(selected.startAt)} · {fmtTime(selected.startAt)} – {fmtTime(selected.endAt)}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Doctor</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{selected.doctor?.name ?? "Unassigned"}</dd>
                  {selected.doctor?.specialty && <dd className="text-xs text-slate-500">{selected.doctor.specialty}</dd>}
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Appointment type</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{selected.consultationType.name}</dd>
                  {selected.service?.name && <dd className="text-xs text-slate-500">{selected.service.name}</dd>}
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Branch</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{selected.branch?.name ?? "—"}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payment</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-700">
                    {selected.payment
                      ? (selected.payment.status === "COMPLETED"
                          ? <><DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Paid ₦{Number(selected.payment.amount).toLocaleString()}</>
                          : <><CreditCard className="h-3.5 w-3.5 text-amber-600" /> {selected.payment.status.toLowerCase()}</>)
                      : "No payment recorded"}
                  </dd>
                  {selected.payment?.reference && (
                    <dd className="mt-1 font-mono text-xs text-slate-500">Ref: {selected.payment.reference}</dd>
                  )}
                </div>
              </dl>

              {selected.medicalNoteUrl && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <Paperclip className="h-3.5 w-3.5" /> Medical note
                  </p>
                  <a href={selected.medicalNoteUrl} target="_blank" rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700">
                    View attachment
                  </a>
                </div>
              )}

              {selected.notes && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <StickyNote className="h-3.5 w-3.5" /> Clinical notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{selected.notes}</p>
                </div>
              )}

              {(selected.status === "CANCELLED" || selected.status === "REJECTED" || selected.status === "NO_SHOW") && (
                <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
                  {selected.status.replace(/_/g, " ")}
                  {selected.cancelledAt ? ` on ${fmtDate(selected.cancelledAt)}` : ""}
                  {selected.cancelledBy ? ` by ${selected.cancelledBy}` : ""}
                  {selected.cancellationReason ? ` — ${selected.cancellationReason}` : ""}
                </div>
              )}

              {ACTIVE_STATUSES.includes(selected.status) && !selected.doctor && canAssign && selected.payment?.status === "COMPLETED" && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <CalendarPlus className="h-4 w-4" /> Unassigned — assign a doctor
                  </p>
                  <p className="mt-1 text-xs text-amber-700">This booking has no doctor yet. Assigning notifies the doctor; already-paid appointments stay confirmed.</p>
                  <select
                    value=""
                    onChange={(e) => assignDoc(e.target.value)}
                    disabled={assigning}
                    className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-200">
                    <option value="" disabled>{assigning ? "Assigning…" : "Assign doctor…"}</option>
                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              {ACTIVE_STATUSES.includes(selected.status) && !selected.doctor && selected.payment?.status !== "COMPLETED" && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">Awaiting payment — view only</p>
                  <p className="mt-1 text-xs text-slate-500">This appointment cannot be assigned until payment is completed.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">
              {selected.status === "CONFIRMED" && selected.doctor && (
                <>
                  <button onClick={() => setDialog({ kind: "cancel", id: selected.id })} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50">Cancel</button>
                  <button onClick={() => setDialog({ kind: "noshow", id: selected.id })} className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50">No Show</button>
                </>
              )}
              {(selected.status === "CONFIRMED" || selected.status === "CHECKED_IN" || selected.status === "IN_PROGRESS") && (
                <button onClick={() => setDialog({ kind: "complete", id: selected.id })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700">Mark completed</button>
              )}
              {selected.status === "PENDING" && selected.doctor && selected.payment?.status === "COMPLETED" && (
                <button onClick={() => setDialog({ kind: "confirm", id: selected.id })} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700">Confirm</button>
              )}
              {selected.status === "PENDING" && selected.payment?.status === "COMPLETED" && (
                <button onClick={() => setDialog({ kind: "cancel", id: selected.id })} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50">Cancel</button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialog !== null}
        title={
          dialog?.kind === "confirm"
            ? "Confirm appointment"
            : dialog?.kind === "cancel"
              ? "Cancel appointment"
              : dialog?.kind === "complete"
                ? "Mark appointment completed"
                : dialog?.kind === "noshow"
                  ? "Mark as no-show"
                  : ""
        }
        message={
          selected ? (
            <p>
              <span className="font-semibold text-slate-900">{selected.patient?.name ?? selected.contactName}</span>
              <span className="font-mono text-xs text-slate-500"> · {selected.referenceNumber}</span>
            </p>
          ) : undefined
        }
        confirmLabel={
          dialog?.kind === "confirm"
            ? "Confirm"
            : dialog?.kind === "cancel"
              ? "Cancel appointment"
              : dialog?.kind === "complete"
                ? "Mark completed"
                : dialog?.kind === "noshow"
                  ? "Mark no-show"
                  : "Confirm"
        }
        danger={dialog?.kind === "cancel" || dialog?.kind === "noshow"}
        busy={actionBusy}
        inputLabel={dialog?.kind === "cancel" ? "Reason (optional)" : undefined}
        inputPlaceholder={dialog?.kind === "cancel" ? "Let the clinic know why" : undefined}
        inputValue={cancelReason}
        onInputChange={setCancelReason}
        error={actionError}
        onConfirm={() => {
          if (!dialog) return;
          if (dialog.kind === "confirm") void confirmed(dialog.id);
          else if (dialog.kind === "cancel") void cancelOne(dialog.id);
          else if (dialog.kind === "complete") void completeOne(dialog.id);
          else if (dialog.kind === "noshow") void markNoShow(dialog.id);
        }}
        onClose={closeDialog}
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
