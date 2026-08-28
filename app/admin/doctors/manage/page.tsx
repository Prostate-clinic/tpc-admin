"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { type DoctorAdminRecord, nestApi } from "@/lib/nest-api";
import { Users, Plus, X, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import Avatar from "@/components/Avatar";

export default function ManageDoctorsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingAccountId, setCreatingAccountId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [doctors, setDoctors] = useState<DoctorAdminRecord[]>([]);
  const [accountModalDoctor, setAccountModalDoctor] = useState<DoctorAdminRecord | null>(null);
  const [accountModalEmail, setAccountModalEmail] = useState("");

  const nonAdmin = user && user.role !== "ADMIN";
  const sortedDoctors = useMemo(() => [...doctors].sort((a, b) => a.name.localeCompare(b.name)), [doctors]);
  const isActive = (d: DoctorAdminRecord) => d.status === "ACTIVE" || d.isActive === true;

  const loadDoctors = async () => {
    setLoading(true); setError("");
    try { const res = await nestApi.getAdminDoctors(); setDoctors(res.doctors || []); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (nonAdmin) { setLoading(false); return; } loadDoctors(); }, [nonAdmin]);

  const openAccountModal = (d: DoctorAdminRecord) => { setAccountModalDoctor(d); setAccountModalEmail(""); setError(""); setSuccess(""); };
  const closeAccountModal = () => { if (creatingAccountId) return; setAccountModalDoctor(null); };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault(); if (!accountModalDoctor) return;
    const email = accountModalEmail.trim();
    if (!email) { setError("Enter an email."); return; }
    setCreatingAccountId(accountModalDoctor.id); setError(""); setSuccess("");
    try { await nestApi.createDoctorAccount(accountModalDoctor.id, email); setSuccess("Account created."); setAccountModalDoctor(null); await loadDoctors(); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setCreatingAccountId(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    setDeletingId(id); setError(""); setSuccess("");
    try { await nestApi.removeDoctor(id); setSuccess(`${name} moved to recycle bin.`); setDoctors((p) => p.filter((d) => d.id !== id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setDeletingId(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" /></div>;

  if (nonAdmin) return <div className="flex items-center justify-center py-20"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><AlertCircle className="mx-auto h-8 w-8 text-red-400" /><p className="mt-2 text-sm text-red-700">Only admins can manage doctors.</p></div></div>;

  return (
    <>
      <div className="animate-fade-up p-4 lg:p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Manage Doctors</h1>
          <p className="mt-1 text-sm text-slate-500">Create accounts and manage doctor profiles.</p>
        </div>

        {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        {success && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4 shrink-0" />{success}</div>}

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100"><Users className="h-5 w-5 text-indigo-600" /></div>
              <h3 className="text-base font-semibold text-slate-900">Doctors</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{doctors.length} total</span>
          </div>

          {sortedDoctors.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">No doctors found</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedDoctors.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={d.image} name={d.name} size={44} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isActive(d) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {isActive(d) ? "Active" : (d.status || "Inactive")}
                    </span>
                    {d.user?.email
                      ? <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">Account linked</span>
                      : <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">No account</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!d.userId && (
                      <button onClick={() => openAccountModal(d)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700">
                        <Plus className="h-3.5 w-3.5" /> Create Account
                      </button>
                    )}
                    <button onClick={() => handleDelete(d.id, d.name)} disabled={deletingId === d.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                      <Trash2 className="h-3.5 w-3.5" /> {deletingId === d.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {accountModalDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeAccountModal}>
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Create Doctor Account</h2>
              <button onClick={closeAccountModal} disabled={Boolean(creatingAccountId)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
                <input type="text" value={accountModalDoctor.name} readOnly className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input type="email" value={accountModalEmail} onChange={(e) => setAccountModalEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-4 ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-indigo-100"
                  placeholder="doctor@clinic.com" required />
              </div>
              <button type="submit" disabled={creatingAccountId === accountModalDoctor.id}
                className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50">
                {creatingAccountId === accountModalDoctor.id ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
