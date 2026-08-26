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
        : await nestApi.getAppointments("COMPLETED", page);
      setAppointments(res.appointments as Appointment[]);
      setPagination(res.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, page]);

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1 className="page-title">Completed Appointments</h1>
        <p className="page-subtitle">{appointments.length} completed</p>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="h-4 w-32 animate-pulse rounded bg-[#f1f5f9]" />
              <div className="mt-2 h-3 w-48 animate-pulse rounded bg-[#f1f5f9]" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state mt-6">
          <div className="empty-state-icon"><CheckCircle className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-[#475569]">No completed appointments</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((apt, idx) => (
            <div key={apt.id} className="card card-hover p-5 animate-fade-up" style={{ animationDelay: `${idx * 0.04}s` } as React.CSSProperties}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ecfdf5]">
                    <User className="h-5 w-5 text-[#059669]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f172a]">{apt.patient.name}</p>
                    <p className="text-xs text-[#94a3b8]">{apt.patient.email}</p>
                  </div>
                </div>
                <span className="badge badge-emerald">COMPLETED</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#94a3b8]" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#94a3b8]">Date</p>
                    <p className="font-medium text-[#334155]">{fmtDate(apt.startAt)} {fmtTime(apt.startAt)}&ndash;{fmtTime(apt.endAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-[#94a3b8]" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#94a3b8]">Doctor</p>
                    <p className="font-medium text-[#334155]">{apt.doctor.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#94a3b8]">Service</p>
                  <p className="font-medium text-[#334155]">{apt.consultationType.name}</p>
                </div>
              </div>
              {apt.payment && (
                <span className="badge badge-emerald mt-3">Paid ₦{Number(apt.payment.amount).toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <Pager pagination={pagination} onPage={setPage} />
    </div>
  );
}
