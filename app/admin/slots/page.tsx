"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi, type ScheduleBlock } from "@/lib/nest-api";

/**
 * Weekly schedule editor.
 *
 * This page used to create individual appointment slots by hand, one date and
 * time at a time. That is gone: the backend now COMPUTES every bookable slot
 * from the recurring schedule configured here, minus leave, holidays, blocked
 * time and existing bookings.
 *
 * So a doctor sets "Mon-Fri, 09:00-17:00" once, and never touches it again —
 * instead of creating 40 rows a week and remembering to stop before their leave.
 */

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

type DayState = {
  enabled: boolean;
  /** Two blocks on one day = a split shift; the gap between them is the break. */
  blocks: { startTime: string; endTime: string }[];
};

const emptyWeek = (): Record<number, DayState> =>
  Object.fromEntries(
    DAYS.map((d) => [d.value, { enabled: false, blocks: [{ startTime: "09:00", endTime: "17:00" }] }]),
  ) as Record<number, DayState>;

const toMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

export default function SchedulePage() {
  const { user } = useAuth();
  const [week, setWeek] = useState<Record<number, DayState>>(emptyWeek);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { schedule } = await nestApi.getWeeklySchedule(
        user?.role === "DOCTOR" ? undefined : user?.doctorId,
      );

      const next = emptyWeek();
      for (const block of schedule) {
        const day = next[block.dayOfWeek];
        if (!day) continue;

        // First block for this weekday replaces the placeholder; a second is a
        // split shift and is appended.
        if (!day.enabled) {
          day.enabled = true;
          day.blocks = [{ startTime: block.startTime, endTime: block.endTime }];
        } else {
          day.blocks.push({ startTime: block.startTime, endTime: block.endTime });
        }
      }

      setWeek(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load schedule");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const validationError = (() => {
    for (const day of DAYS) {
      const state = week[day.value];
      if (!state?.enabled) continue;

      for (const block of state.blocks) {
        if (toMinutes(block.endTime) <= toMinutes(block.startTime)) {
          return `${day.label}: end time must be after start time.`;
        }
      }

      // Overlapping blocks on one day are always a mistake, and the backend
      // rejects them — catch it here so the doctor sees it as they type.
      const sorted = [...state.blocks].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
      for (let i = 1; i < sorted.length; i += 1) {
        if (toMinutes(sorted[i].startTime) < toMinutes(sorted[i - 1].endTime)) {
          return `${day.label}: the two blocks overlap.`;
        }
      }
    }
    return "";
  })();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    setSaving(true);
    setError("");
    setSaved("");

    const blocks: ScheduleBlock[] = DAYS.flatMap((day) => {
      const state = week[day.value];
      if (!state?.enabled) return [];

      return state.blocks.map((block) => ({
        dayOfWeek: day.value,
        startTime: block.startTime,
        endTime: block.endTime,
      }));
    });

    try {
      await nestApi.setWeeklySchedule({
        blocks,
        doctorId: user?.role === "DOCTOR" ? undefined : user?.doctorId,
      });

      setSaved("Schedule saved. Bookable slots are generated from it automatically.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save schedule");
    } finally {
      setSaving(false);
    }
  };

  const setDay = (dayValue: number, update: Partial<DayState>) =>
    setWeek((prev) => ({ ...prev, [dayValue]: { ...prev[dayValue], ...update } }));

  const setBlock = (dayValue: number, index: number, field: "startTime" | "endTime", value: string) =>
    setWeek((prev) => {
      const blocks = prev[dayValue].blocks.map((block, i) =>
        i === index ? { ...block, [field]: value } : block,
      );
      return { ...prev, [dayValue]: { ...prev[dayValue], blocks } };
    });

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading schedule…</div>;
  }

  return (
    <div className="p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Weekly Schedule</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Set your recurring working hours. Bookable slots are generated from this automatically —
          you no longer create them one by one. Leave, blocked time and existing appointments are
          subtracted for you.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}
      {!error && validationError && (
        <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {validationError}
        </div>
      )}
      {saved && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{saved}</div>
      )}

      <form onSubmit={save} className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="space-y-3">
          {DAYS.map((day) => {
            const state = week[day.value];

            return (
              <div
                key={day.value}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3"
              >
                <label className="flex w-32 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={state.enabled}
                    onChange={(e) => setDay(day.value, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-700">{day.label}</span>
                </label>

                {!state.enabled ? (
                  <span className="text-xs text-slate-400">Day off</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    {state.blocks.map((block, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={block.startTime}
                          onChange={(e) => setBlock(day.value, index, "startTime", e.target.value)}
                          className="h-9 rounded-lg border border-slate-300 px-2 text-sm outline-none ring-indigo-300 focus:ring"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <input
                          type="time"
                          value={block.endTime}
                          onChange={(e) => setBlock(day.value, index, "endTime", e.target.value)}
                          className="h-9 rounded-lg border border-slate-300 px-2 text-sm outline-none ring-indigo-300 focus:ring"
                        />

                        {state.blocks.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDay(day.value, {
                                blocks: state.blocks.filter((_, i) => i !== index),
                              })
                            }
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}

                    {state.blocks.length < 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDay(day.value, {
                            blocks: [...state.blocks, { startTime: "14:00", endTime: "17:00" }],
                          })
                        }
                        className="text-xs font-semibold text-[#1a1aaa] hover:underline"
                        // Two blocks on one day = a split shift. The GAP between
                        // them is the lunch break; it needs no separate record.
                        title="Split the day into two blocks. The gap between them is your break."
                      >
                        + Split shift
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={saving || Boolean(validationError)}
          className="mt-5 rounded-full bg-[#1a1aaa] px-5 py-2 text-sm font-semibold text-white hover:bg-[#111188] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Schedule"}
        </button>
      </form>
    </div>
  );
}
