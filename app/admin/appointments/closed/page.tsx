"use client";

import { useEffect, useState } from "react";
import { nestApi, PaginationMeta } from "@/lib/nest-api";
import { useAuth } from "@/contexts/AuthContext";
import Pager from "@/components/Pager";
import { Clock, User, Stethoscope, CheckCircle } from "lucide-react";

type Appointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  patient: { name: string; email: string | null; phone: string | null };
  doctor: { name: string };
  consultationType: { name: string; durationMinutes: number };
  payment: { amount: string; status: string } | null;
};

const CLINIC_TZ = "Africa/Lagos";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: CLINIC_TZ });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CLINIC_TZ });

export default function ClosedAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = user?.role === "DOCTOR"
        ? await nestApi.getMyAppointments("COMPLETED", page)
        : await nestApi.getAppointments({ status: "COMPLETED", page });
      setAppointments(res.appointments as Appointment[]);
      setPagination(res.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, page]);

  return (
    <div className="animate-fade-up p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Completed Appointments</h1>
        <p className="mt-1 text-sm text-slate-500">{appointments.length} completed</p>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-48 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50"><CheckCircle className="h-6 w-6 text-slate-300" /></div>
          <p className="mt-3 text-sm font-medium text-slate-500">No completed appointments</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((apt, idx) => (
            <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-5 animate-fade-up" style={{ animationDelay: `${idx * 0.04}s` } as React.CSSProperties}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{apt.patient.name}</p>
                    <p className="text-xs text-slate-400">{apt.patient.email}</p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-700">COMPLETED</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Date</p>
                    <p className="font-medium text-slate-700">{fmtDate(apt.startAt)} {fmtTime(apt.startAt)}&ndash;{fmtTime(apt.endAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Doctor</p>
                    <p className="font-medium text-slate-700">{apt.doctor.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Service</p>
                  <p className="font-medium text-slate-700">{apt.consultationType.name}</p>
                </div>
              </div>
              {apt.payment && (
                <span className="mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-700">Paid ₦{Number(apt.payment.amount).toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <Pager pagination={pagination} onPage={setPage} />
    </div>
  );
}