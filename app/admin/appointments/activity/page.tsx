"use client";

import { useEffect, useState } from "react";
import { nestApi } from "@/lib/nest-api";

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

/** Renders a UTC instant in the clinic's timezone, not the browser's. */
const CLINIC_TZ = "Africa/Lagos";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CLINIC_TZ,
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: CLINIC_TZ,
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CLINIC_TZ,
  });

const ACTION_STYLES: Record<string, string> = {
  CREATED: "bg-indigo-100 text-indigo-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  RESCHEDULED: "bg-sky-100 text-sky-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-rose-100 text-rose-700",
  CHECKED_IN: "bg-teal-100 text-teal-700",
  STARTED: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-green-100 text-green-700",
  MARKED_NO_SHOW: "bg-amber-100 text-amber-700",
  EXPIRED: "bg-slate-200 text-slate-600",
};

const ACTOR_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  FRONTDESK: "Front desk",
  DOCTOR: "Doctor",
  PATIENT: "Patient",
  GUEST: "Guest",
  SYSTEM: "System",
};

const ACTION_FILTERS = [
  "",
  "CREATED",
  "CONFIRMED",
  "RESCHEDULED",
  "CANCELLED",
  "COMPLETED",
  "MARKED_NO_SHOW",
  "REJECTED",
  "EXPIRED",
] as const;

/** What changed, in one line — e.g. "PENDING → CONFIRMED" or "moved to Aug 30". */
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
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("");

  const load = async (action: string) => {
    setLoading(true);
    try {
      const res = await nestApi.getActivityLog({ action: action || undefined, take: 300 });
      setEntries(res.entries as ActivityEntry[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(actionFilter); }, [actionFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every action taken on every appointment — bookings, confirmations, completions, no-shows, cancellations.
          </p>
        </div>
        <button onClick={() => load(actionFilter)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Refresh</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ACTION_FILTERS.map((a) => (
          <button
            key={a || "all"}
            onClick={() => setActionFilter(a)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              actionFilter === a
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {a ? a.replace(/_/g, " ") : "All actions"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No activity found.</div>
      ) : (
        <div className="mt-6 space-y-2">
          {entries.map((e) => {
            const detail = actionDetail(e);
            return (
              <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ACTION_STYLES[e.action] ?? "bg-slate-100 text-slate-700"}`}>
                    {e.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-400">{fmtDateTime(e.createdAt)}</span>
                  <span className="text-xs text-slate-500">
                    by{" "}
                    <span className="font-medium text-slate-700">
                      {e.actor.name ?? e.actor.id ?? "Unknown"}
                    </span>{" "}
                    ({ACTOR_LABELS[e.actor.type] ?? e.actor.type})
                  </span>
                </div>

                <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="text-slate-400">Patient:</span>{" "}
                    {e.appointment.contactName} <span className="text-xs text-slate-400">({e.appointment.contactEmail})</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Doctor:</span> {e.appointment.doctorName}
                    <span className="text-slate-400"> · Service:</span> {e.appointment.consultationName}
                  </p>
                  <p>
                    <span className="text-slate-400">Scheduled:</span>{" "}
                    {fmtDate(e.appointment.startAt)} {fmtTime(e.appointment.startAt)} – {fmtTime(e.appointment.endAt)}
                  </p>
                  <p>
                    <span className="text-slate-400">Ref:</span>{" "}
                    <span className="font-mono text-xs">{e.appointment.referenceNumber}</span>
                    <span className="text-slate-400"> · Current status:</span> {e.appointment.status}
                  </p>
                </div>

                {(detail || e.reason || e.appointment.cancellationReason) && (
                  <p className="mt-2 text-xs text-slate-500">
                    {detail && <span>{detail}. </span>}
                    {e.reason && <span>Reason: {e.reason}. </span>}
                    {!e.reason && e.action === "CANCELLED" && e.appointment.cancellationReason && (
                      <span>Reason: {e.appointment.cancellationReason}</span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
