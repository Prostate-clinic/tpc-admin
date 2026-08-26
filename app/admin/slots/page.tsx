"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi, type ScheduleBlock } from "@/lib/nest-api";
import { Clock, Plus, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

type DayState = { enabled: boolean; blocks: { startTime: string; endTime: string }[] };

const emptyWeek = (): Record<number, DayState> =>
  Object.fromEntries(DAYS.map((d) => [d.value, { enabled: false, blocks: [{ startTime: "09:00", endTime: "17:00" }] }])) as Record<number, DayState>;

const toMinutes = (v: string) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };

export default function SchedulePage() {
  const { user } = useAuth();
  const [week, setWeek] = useState<Record<number, DayState>>(emptyWeek);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { schedule } = await nestApi.getWeeklySchedule(user?.role === "DOCTOR" ? undefined : user?.doctorId);
      const next = emptyWeek();
      for (const block of schedule) {
        const day = next[block.dayOfWeek];
        if (!day) continue;
        if (!day.enabled) { day.enabled = true; day.blocks = [{ startTime: block.startTime, endTime: block.endTime }]; }
        else { day.blocks.push({ startTime: block.startTime, endTime: block.endTime }); }
      }
      setWeek(next);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load schedule"); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) void load(); }, [user, load]);

  const validationError = (() => {
    for (const day of DAYS) {
      const state = week[day.value];
      if (!state?.enabled) continue;
      for (const block of state.blocks) {
        if (toMinutes(block.endTime) <= toMinutes(block.startTime)) return `${day.label}: end time must be after start time.`;
      }
      const sorted = [...state.blocks].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
      for (let i = 1; i < sorted.length; i++) {
        if (toMinutes(sorted[i].startTime) < toMinutes(sorted[i - 1].endTime)) return `${day.label}: blocks overlap.`;
      }
    }
    return "";
  })();

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (validationError) return;
    setSaving(true); setError(""); setSaved("");
    const blocks: ScheduleBlock[] = DAYS.flatMap((day) => {
      const state = week[day.value]; if (!state?.enabled) return [];
      return state.blocks.map((b) => ({ dayOfWeek: day.value, startTime: b.startTime, endTime: b.endTime }));
    });
    try {
      await nestApi.setWeeklySchedule({ blocks, doctorId: user?.role === "DOCTOR" ? undefined : user?.doctorId });
      setSaved("Schedule saved. Slots are generated automatically."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save schedule"); }
    finally { setSaving(false); }
  };

  const setDay = (v: number, u: Partial<DayState>) => setWeek((p) => ({ ...p, [v]: { ...p[v], ...u } }));
  const setBlock = (dv: number, idx: number, f: "startTime" | "endTime", v: string) =>
    setWeek((p) => ({ ...p, [dv]: { ...p[dv], blocks: p[dv].blocks.map((b, i) => i === idx ? { ...b, [f]: v } : b) } }));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" /></div>;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Weekly Schedule</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">Set your recurring working hours. Slots are generated automatically.</p>
      </div>

      {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {!error && validationError && <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"><AlertCircle className="h-4 w-4 shrink-0" />{validationError}</div>}
      {saved && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4 shrink-0" />{saved}</div>}

      <form onSubmit={save}>
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {DAYS.map((day, idx) => {
            const state = week[day.value];
            return (
              <div key={day.value} className={`flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50 ${idx < DAYS.length - 1 ? "border-b border-slate-100" : ""}`}>
                <label className="flex w-32 items-center gap-3">
                  <input type="checkbox" checked={state.enabled} onChange={(e) => setDay(day.value, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className={`text-sm font-semibold ${state.enabled ? "text-slate-900" : "text-slate-400"}`}>{day.label}</span>
                </label>
                {!state.enabled ? (
                  <span className="text-xs text-slate-400 italic">Day off</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    {state.blocks.map((block, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="time" value={block.startTime} onChange={(e) => setBlock(day.value, index, "startTime", e.target.value)}
                          className="h-9 w-auto rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                        <span className="text-xs text-slate-400">to</span>
                        <input type="time" value={block.endTime} onChange={(e) => setBlock(day.value, index, "endTime", e.target.value)}
                          className="h-9 w-auto rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                        {state.blocks.length > 1 && (
                          <button type="button" onClick={() => setDay(day.value, { blocks: state.blocks.filter((_, i) => i !== index) })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {state.blocks.length < 2 && (
                      <button type="button" onClick={() => setDay(day.value, { blocks: [...state.blocks, { startTime: "14:00", endTime: "17:00" }] })}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                        <Plus className="h-3.5 w-3.5" /> Split shift
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={saving || Boolean(validationError)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Clock className="h-4 w-4" /> Save Schedule</>}
          </button>
          <button type="button" onClick={load} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Reset</button>
        </div>
      </form>
    </div>
  );
}
