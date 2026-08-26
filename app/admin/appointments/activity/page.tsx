"use client";

import { useEffect, useState } from "react";
import { nestApi, PaginationMeta } from "@/lib/nest-api";
import Pager from "@/components/Pager";
import { RefreshCw, AlertCircle } from "lucide-react";

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
  CREATED: "badge-indigo",
  CONFIRMED: "badge-emerald",
  RESCHEDULED: "badge-sky",
  CANCELLED: "badge-rose",
  REJECTED: "badge-rose",
  CHECKED_IN: "badge-sky",
  STARTED: "badge-violet",
  COMPLETED: "badge-emerald",
  MARKED_NO_SHOW: "badge-amber",
  EXPIRED: "badge-slate",
};

const ACTOR_LABELS: Record<string, string> = {
  ADMIN: "Admin", FRONTDESK: "Front desk", DOCTOR: "Doctor",
  PATIENT: "Patient", GUEST: "Guest", SYSTEM: "System",
};

const ACTION_FILTERS = ["", "CREATED", "CONFIRMED", "RESCHEDULED", "CANCELLED", "COMPLETED", "MARKED_NO_SHOW", "REJECTED", "EXPIRED"] as const;

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

  const load = async (action: string, p: number) => {
    setLoading(true);
    try {
      const res = await nestApi.getActivityLog({ action: action || undefined }, p);
      setEntries(res.entries as ActivityEntry[]);
      setPagination(res.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(actionFilter, page); }, [actionFilter, page]);

  const selectFilter = (a: string) => { setActionFilter(a); setPage(1); };

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="page-header">
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Every action taken on every appointment.</p>
        </div>
        <button onClick={() => load(actionFilter, page)} className="btn-secondary">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="tab-group mt-4">
        {ACTION_FILTERS.map((a) => (
          <button key={a || "all"} onClick={() => selectFilter(a)} className={`tab-pill ${actionFilter === a ? "active" : ""}`}>
            {a ? a.replace(/_/g, " ") : "All actions"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4"><div className="h-4 w-32 animate-pulse rounded bg-[#f1f5f9]" /></div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state mt-6">
          <div className="empty-state-icon"><AlertCircle className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-[#475569]">No activity found</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {entries.map((e, idx) => {
            const detail = actionDetail(e);
            return (
              <div key={e.id} className="card p-4 animate-fade-up" style={{ animationDelay: `${idx * 0.03}s` } as React.CSSProperties}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`badge ${ACTION_BADGE[e.action] ?? "badge-slate"}`}>
                    {e.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-[#94a3b8]">{fmtDateTime(e.createdAt)}</span>
                  <span className="text-xs text-[#64748b]">
                    by <span className="font-medium text-[#334155]">{e.actor.name ?? e.actor.id ?? "Unknown"}</span> ({ACTOR_LABELS[e.actor.type] ?? e.actor.type})
                  </span>
                </div>
                <div className="mt-2 grid gap-1 text-sm text-[#475569] sm:grid-cols-2">
                  <p><span className="text-[#94a3b8]">Patient:</span> {e.appointment.contactName} <span className="text-xs text-[#94a3b8]">({e.appointment.contactEmail})</span></p>
                  <p><span className="text-[#94a3b8]">Doctor:</span> {e.appointment.doctorName} <span className="text-[#94a3b8]">· Service:</span> {e.appointment.consultationName}</p>
                  <p><span className="text-[#94a3b8]">Scheduled:</span> {fmtDate(e.appointment.startAt)} {fmtTime(e.appointment.startAt)} – {fmtTime(e.appointment.endAt)}</p>
                  <p><span className="text-[#94a3b8]">Ref:</span> <span className="font-mono text-xs">{e.appointment.referenceNumber}</span> <span className="text-[#94a3b8]">· Status:</span> {e.appointment.status}</p>
                </div>
                {(detail || e.reason || e.appointment.cancellationReason) && (
                  <p className="mt-2 text-xs text-[#64748b]">
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
