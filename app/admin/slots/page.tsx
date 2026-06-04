"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi } from "@/lib/nest-api";

type Slot = { id: string; date: string; startTime: string; endTime: string; isBooked: boolean };

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function isPastDate(date: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);
  return selected < today;
}

export default function SlotsPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", startTime: "09:00", endTime: "10:00" });
  const [error, setError] = useState("");

  const sortedSlots = [...slots].sort((a, b) => {
    const dateCmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCmp !== 0) return dateCmp;
    return toMinutes(a.startTime) - toMinutes(b.startTime);
  });

  const durationMinutes = toMinutes(form.endTime) - toMinutes(form.startTime);

  const validationError = (() => {
    if (!form.date) return "Date is required.";
    if (isPastDate(form.date)) return "You cannot create slots in the past.";
    if (durationMinutes <= 0) return "End time must be later than start time.";
    if (durationMinutes < 15) return "Slot duration must be at least 15 minutes.";

    const newStart = toMinutes(form.startTime);
    const newEnd = toMinutes(form.endTime);
    const overlap = slots.some((slot) => {
      if (slot.date !== form.date) return false;
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);
      return newStart < slotEnd && newEnd > slotStart;
    });

    if (overlap) return "This slot overlaps an existing open slot.";
    return "";
  })();

  const load = async () => {
    setLoading(true);
    try {
      if (!user?.doctorId) return;
      const res = await nestApi.getSlots(user.doctorId);
      setSlots(res.slots as Slot[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const createSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await nestApi.createSlot({ ...form, doctorId: user?.doctorId });
      setShowForm(false);
      setForm({ date: "", startTime: "09:00", endTime: "10:00" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create slot");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Slots</h1>
          <p className="mt-1 text-sm text-slate-500">{slots.length} open slot{slots.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={submitting}
          className="rounded-full bg-[#1a1aaa] px-5 py-2 text-sm font-semibold text-white hover:bg-[#111188] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {showForm ? "Cancel" : "+ New Slot"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSlot} className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          {error && <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
          {!error && validationError && (
            <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">{validationError}</div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Start</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">End</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring" required />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Duration: {durationMinutes > 0 ? `${durationMinutes} minutes` : "-"}</p>
          <button
            type="submit"
            disabled={submitting || Boolean(validationError)}
            className="mt-4 rounded-full bg-[#1a1aaa] px-5 py-2 text-sm font-semibold text-white hover:bg-[#111188] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Slot"}
          </button>
        </form>
      )}

      {slots.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No open slots.</div>
      ) : (
        <div className="mt-6 space-y-2">
          {sortedSlots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(slot.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-xs text-slate-500">{slot.startTime} - {slot.endTime}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Available</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
