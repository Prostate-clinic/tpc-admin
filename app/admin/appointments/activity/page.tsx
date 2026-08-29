"use client";

import { useEffect, useState } from "react";
import { nestApi, PaginationMeta } from "@/lib/nest-api";
import Pager from "@/components/Pager";
import { RefreshCw, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";

type ActivityEntry = {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  fromStartAt: string | null;
  toStartAt: string | null;
  reason: string | null;
  createdAt: string;
  actor: { type: string; id: string | null; name: string | null };
  appointment: {
    id: string;
    referenceNumber: string;
    status: string;
    startAt: string;
    endAt: string;
    contactName: string;
    contactEmail: string;
    cancellationReason: string | null;
    doctorName: string;
    consultationName: string;
  };
};

const CLINIC_TZ = "Africa/Lagos";
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CLINIC_TZ });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: CLINIC_TZ });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CLINIC_TZ });

const ACTION_BADGE: Record<string, string> = {
  CREATED: "bg-indigo-100 text-indigo-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  RESCHEDULE_REQUESTED: "bg-sky-100 text-sky-700",
  RESCHEDULED: "bg-sky-100 text-sky-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-rose-100 text-rose-700",
  CHECKED_IN: "bg-sky-100 text-sky-700",
  STARTED: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  MARKED_NO_SHOW: "bg-amber-100 text-amber-700",
  EXPIRED: "bg-slate-100 text-slate-600",
  NOTES_UPDATED: "bg-slate-100 text-slate-600",
  ASSIGNED_DOCTOR: "bg-teal-100 text-teal-700",
  PAYMENT_INITIATED: "bg-cyan-100 text-cyan-700",
  PAYMENT_COMPLETED: "bg-emerald-100 text-emerald-700",
  PAYMENT_FAILED: "bg-rose-100 text-rose-700",
  PAYMENT_REFUNDED: "bg-fuchsia-100 text-fuchsia-700",
};

const ACTOR_LABELS: Record<string, string> = {
  ADMIN: "Admin", FRONTDESK: "Front desk", DOCTOR: "Doctor",
  PATIENT: "Patient", GUEST: "Guest", SYSTEM: "System",
};

const FILTER_GROUPS: { key: string; label: string; actions: readonly string[] }[] = [
  {
    key: "appointments",
    label: "Appointments",
    actions: [
      "CREATED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULED",
      "CANCELLED", "REJECTED", "CHECKED_IN", "STARTED", "COMPLETED",
      "MARKED_NO_SHOW", "EXPIRED", "NOTES_UPDATED", "ASSIGNED_DOCTOR",
    ],
  },
  {
    key: "payments",
    label: "Payments",
    actions: ["PAYMENT_INITIATED", "PAYMENT_COMPLETED", "PAYMENT_FAILED", "PAYMENT_REFUNDED"],
  },
];

function actionDetail(e: ActivityEntry): string | null {
  if (e.action === "RESCHEDULED" && e.fromStartAt && e.toStartAt) {
    return `Moved from ${fmtDate(e.fromStartAt)} ${fmtTime(e.fromStartAt)} to ${fmtDate(e.toStartAt)} ${fmtTime(e.toStartAt)}`;
  }
  if (e.fromStatus && e.toStatus && e.fromStatus !== e.toStatus) {
    return `${e.fromStatus} → ${e.toStatus}`;
  }
  return e.toStatus ?? null;
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  // Which group is expanded. Only one at a time; "" = "All actions".
  const [groupFilter, setGroupFilter] = useState<string>("");

  const load = async (group: string, action: string, p: number) => {
    setLoading(true);
    try {
      const groupActions = FILTER_GROUPS.find((g) => g.key === group)?.actions ?? [];
      const filters = group
        ? action
          ? { action }
          : { actions: groupActions.join(",") }
        : {};
      const res = await nestApi.getActivityLog(filters, p);
      setEntries(res.entries as ActivityEntry[]);
      setPagination(res.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(groupFilter, actionFilter, page); }, [groupFilter, actionFilter, page]);

  const selectAll = () => { setGroupFilter(""); setActionFilter(""); setPage(1); };
  const selectGroup = (key: string) => {
    if (groupFilter === key) { selectAll(); return; }
    setGroupFilter(key); setActionFilter(""); setPage(1);
  };
  const selectAction = (a: string) => { setActionFilter(a); setPage(1); };

  return (
    <div className="animate-fade-up p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="mt-1 text-sm text-slate-500">Every action taken on every appointment.</p>
        </div>
        <button onClick={() => load(groupFilter, actionFilter, page)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 overflow-x-scroll">
          <button
            onClick={selectAll}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${groupFilter === "" && actionFilter === "" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            All actions
          </button>
          {FILTER_GROUPS.map((group) => {
            const active = groupFilter === group.key;
            return (
              <button
                key={group.key}
                onClick={() => selectGroup(group.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {group.label}
                {active ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>

        {FILTER_GROUPS.filter((g) => g.key === groupFilter).map((group) => (
          <div key={group.key} className="ml-2 flex flex-wrap gap-2 border-l-2 border-indigo-100 pl-3">
            {group.actions.map((a) => (
              <button
                key={a}
                onClick={() => selectAction(a)}
                className={`rounded-full px-3.5 py-1 text-[11px] font-semibold transition ${actionFilter === a ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
                {a.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="h-4 w-32 animate-pulse rounded bg-slate-100" /></div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50"><AlertCircle className="h-6 w-6 text-slate-300" /></div>
          <p className="mt-3 text-sm font-medium text-slate-500">No activity found</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {entries.map((e, idx) => {
            const detail = actionDetail(e);
            return (
              <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 animate-fade-up" style={{ animationDelay: `${idx * 0.03}s` } as React.CSSProperties}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ACTION_BADGE[e.action] ?? "bg-slate-100 text-slate-600"}`}>
                    {e.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-400">{fmtDateTime(e.createdAt)}</span>
                  <span className="text-xs text-slate-500">
                    by <span className="font-medium text-slate-700">{e.actor.name ?? e.actor.id ?? "Unknown"}</span> ({ACTOR_LABELS[e.actor.type] ?? e.actor.type})
                  </span>
                </div>
                <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                  <p><span className="text-slate-400">Patient:</span> {e.appointment.contactName} <span className="text-xs text-slate-400">({e.appointment.contactEmail})</span></p>
                  <p><span className="text-slate-400">Doctor:</span> {e.appointment.doctorName} <span className="text-slate-400">· Service:</span> {e.appointment.consultationName}</p>
                  <p><span className="text-slate-400">Scheduled:</span> {fmtDate(e.appointment.startAt)} {fmtTime(e.appointment.startAt)} – {fmtTime(e.appointment.endAt)}</p>
                  <p><span className="text-slate-400">Ref:</span> <span className="font-mono text-xs">{e.appointment.referenceNumber}</span> <span className="text-slate-400">· Status:</span> {e.appointment.status}</p>
                </div>
                {(detail || e.reason || e.appointment.cancellationReason) && (
                  <p className="mt-2 text-xs text-slate-500">
                    {detail && <span>{detail}. </span>}
                    {e.reason && <span>Reason: {e.reason}. </span>}
                    {!e.reason && e.action === "CANCELLED" && e.appointment.cancellationReason && <span>Reason: {e.appointment.cancellationReason}</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pager pagination={pagination} onPage={setPage} />
    </div>
  );
}