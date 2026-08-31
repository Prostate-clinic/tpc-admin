"use client";

import { useEffect, useState } from "react";
import { nestApi, PaginationMeta } from "@/lib/nest-api";
import Pager from "@/components/Pager";
import { RefreshCw, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";

type ActivityEntry = {
  id: string;
  type: string;
  action: string;
  entityRef: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { type: string; id: string | null; name: string | null };
  appointment?: {
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

const ACTOR_LABELS: Record<string, string> = {
  ADMIN: "Admin", FRONTDESK: "Front desk", DOCTOR: "Doctor",
  PATIENT: "Patient", GUEST: "Guest", SYSTEM: "System",
};

const TYPE_GROUPS: { key: string; label: string; actions: readonly string[] }[] = [
  {
    key: "APPOINTMENT",
    label: "Appointments",
    actions: [
      "CREATED", "CONFIRMED", "RESCHEDULE_REQUESTED", "RESCHEDULED",
      "CANCELLED", "REJECTED", "CHECKED_IN", "STARTED", "COMPLETED",
      "MARKED_NO_SHOW", "EXPIRED", "NOTES_UPDATED", "ASSIGNED_DOCTOR",
    ],
  },
  {
    key: "PAYMENT",
    label: "Payments",
    actions: ["INITIATED", "COMPLETED", "FAILED", "REFUNDED"],
  },
  {
    key: "DOCTOR",
    label: "Doctors",
    actions: ["CREATED", "ARCHIVED", "RESTORED"],
  },
];

const ACTION_BADGE: Record<string, string> = {
  "APPOINTMENT:CREATED": "bg-indigo-100 text-indigo-700",
  "APPOINTMENT:CONFIRMED": "bg-emerald-100 text-emerald-700",
  "APPOINTMENT:RESCHEDULE_REQUESTED": "bg-sky-100 text-sky-700",
  "APPOINTMENT:RESCHEDULED": "bg-sky-100 text-sky-700",
  "APPOINTMENT:CANCELLED": "bg-rose-100 text-rose-700",
  "APPOINTMENT:REJECTED": "bg-rose-100 text-rose-700",
  "APPOINTMENT:CHECKED_IN": "bg-sky-100 text-sky-700",
  "APPOINTMENT:STARTED": "bg-violet-100 text-violet-700",
  "APPOINTMENT:COMPLETED": "bg-emerald-100 text-emerald-700",
  "APPOINTMENT:MARKED_NO_SHOW": "bg-amber-100 text-amber-700",
  "APPOINTMENT:EXPIRED": "bg-slate-100 text-slate-600",
  "APPOINTMENT:NOTES_UPDATED": "bg-slate-100 text-slate-600",
  "APPOINTMENT:ASSIGNED_DOCTOR": "bg-teal-100 text-teal-700",
  "PAYMENT:INITIATED": "bg-cyan-100 text-cyan-700",
  "PAYMENT:COMPLETED": "bg-emerald-100 text-emerald-700",
  "PAYMENT:FAILED": "bg-rose-100 text-rose-700",
  "PAYMENT:REFUNDED": "bg-fuchsia-100 text-fuchsia-700",
  "DOCTOR:CREATED": "bg-teal-100 text-teal-700",
  "DOCTOR:ARCHIVED": "bg-orange-100 text-orange-700",
  "DOCTOR:RESTORED": "bg-emerald-100 text-emerald-700",
};

const badgeClass = (type: string, action: string) =>
  ACTION_BADGE[`${type}:${action}`] ?? "bg-slate-100 text-slate-600";

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  // Which type group is expanded. Only one at a time; "" = "All actions".
  const [groupFilter, setGroupFilter] = useState<string>("");

  const load = async (group: string, action: string, p: number) => {
    setLoading(true);
    try {
      const filters = group
        ? action
          ? { type: group, action }
          : { type: group }
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

  const renderDetailRow = (e: ActivityEntry) => {
    if (e.type === "APPOINTMENT" && e.appointment) {
      const a = e.appointment;
      const m = e.metadata as Record<string, unknown> | null;
      let detail: string | null = null;
      if (e.action === "RESCHEDULED" && m?.fromStartAt && m?.toStartAt) {
        detail = `Moved from ${fmtDate(String(m.fromStartAt))} ${fmtTime(String(m.fromStartAt))} to ${fmtDate(String(m.toStartAt))} ${fmtTime(String(m.toStartAt))}`;
      } else if (m?.fromStatus && m?.toStatus && m.fromStatus !== m.toStatus) {
        detail = `${String(m.fromStatus)} → ${String(m.toStatus)}`;
      } else if (m?.toStatus) {
        detail = String(m.toStatus);
      }
      const reason = m?.reason ? String(m.reason) : undefined;

      return (
        <>
          <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            <p><span className="text-slate-400">Patient:</span> {a.contactName} <span className="text-xs text-slate-400">({a.contactEmail})</span></p>
            <p><span className="text-slate-400">Doctor:</span> {a.doctorName} <span className="text-slate-400">· Service:</span> {a.consultationName}</p>
            <p><span className="text-slate-400">Scheduled:</span> {fmtDate(a.startAt)} {fmtTime(a.startAt)} – {fmtTime(a.endAt)}</p>
            <p><span className="text-slate-400">Ref:</span> <span className="font-mono text-xs">{a.referenceNumber}</span> <span className="text-slate-400">· Status:</span> {a.status}</p>
          </div>
          {(detail || reason || a.cancellationReason) && (
            <p className="mt-2 text-xs text-slate-500">
              {detail && <span>{detail}. </span>}
              {reason && <span>Reason: {reason}. </span>}
              {!reason && e.action === "CANCELLED" && a.cancellationReason && <span>Reason: {a.cancellationReason}</span>}
            </p>
          )}
        </>
      );
    }

    if (e.type === "PAYMENT") {
      const m = e.metadata as Record<string, unknown> | null;
      const amount = m?.amount != null ? Number(m.amount).toLocaleString("en-NG") : null;
      return (
        <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
          <p><span className="text-slate-400">Patient:</span> {m?.patientName ? String(m.patientName) : "-"} {m?.patientEmail ? <span className="text-xs text-slate-400">({String(m.patientEmail)})</span> : null}</p>
          <p><span className="text-slate-400">Reference:</span> <span className="font-mono text-xs">{e.entityRef ?? "-"}</span></p>
          <p><span className="text-slate-400">Amount:</span> {amount ? `₦${amount}` : "-"} <span className="text-slate-400">· Currency:</span> {m?.currency ? String(m.currency) : "-"}</p>
          <p><span className="text-slate-400">Status:</span> <span className="font-medium">{m?.status ? String(m.status).toLowerCase() : e.action.toLowerCase()}</span></p>
        </div>
      );
    }

    if (e.type === "DOCTOR") {
      const message =
        e.action === "ARCHIVED"
          ? "Doctor moved to the recycle bin"
          : e.action === "RESTORED"
            ? "Doctor restored from the recycle bin"
            : "Doctor account created";
      return (
        <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
          <p><span className="text-slate-400">Doctor:</span> {e.entityRef ?? "-"}</p>
          <p><span className="text-slate-400">Event:</span> {message}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="animate-fade-up p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="mt-1 text-sm text-slate-500">Every action taken across appointments, payments and doctors.</p>
        </div>
        <button onClick={() => load(groupFilter, actionFilter, page)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectAll}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${groupFilter === "" && actionFilter === "" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            All actions
          </button>
          {TYPE_GROUPS.map((group) => {
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

        {TYPE_GROUPS.filter((g) => g.key === groupFilter).map((group) => (
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
          {entries.map((e, idx) => (
            <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 animate-fade-up" style={{ animationDelay: `${idx * 0.03}s` } as React.CSSProperties}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass(e.type, e.action)}`}>
                  {e.action.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-slate-400">{fmtDateTime(e.createdAt)}</span>
                <span className="text-xs text-slate-500">
                  by <span className="font-medium text-slate-700">{e.actor.name ?? e.actor.id ?? "Unknown"}</span> ({ACTOR_LABELS[e.actor.type] ?? e.actor.type})
                </span>
              </div>
              {renderDetailRow(e)}
            </div>
          ))}
        </div>
      )}

      <Pager pagination={pagination} onPage={setPage} />
    </div>
  );
}