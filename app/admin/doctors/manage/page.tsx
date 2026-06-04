"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { type DoctorAdminRecord, nestApi } from "@/lib/nest-api";
import Image from "next/image";

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

    const sortedDoctors = useMemo(
        () => [...doctors].sort((a, b) => a.name.localeCompare(b.name)),
        [doctors],
    );

    const isDoctorActive = (doctor: DoctorAdminRecord) => doctor.status === "ACTIVE" || doctor.isActive === true;
    const doctorInitials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase() || "").join("");

    const loadDoctors = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await nestApi.getAdminDoctors();
            setDoctors(res.doctors || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load doctors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (nonAdmin) {
            setLoading(false);
            return;
        }

        loadDoctors();
    }, [nonAdmin]);

    const openAccountModal = (doctor: DoctorAdminRecord) => {
        setAccountModalDoctor(doctor);
        setAccountModalEmail("");
        setError("");
        setSuccess("");
    };

    const closeAccountModal = () => {
        if (creatingAccountId) return;
        setAccountModalDoctor(null);
        setAccountModalEmail("");
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountModalDoctor) return;

        const email = accountModalEmail.trim();
        if (!email) {
            setError("Enter an email to create a doctor account.");
            return;
        }

        setCreatingAccountId(accountModalDoctor.id);
        setError("");
        setSuccess("");

        try {
            await nestApi.createDoctorAccount(accountModalDoctor.id, email);
            setSuccess("Doctor account created successfully.");
            setAccountModalDoctor(null);
            setAccountModalEmail("");
            await loadDoctors();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create doctor account");
        } finally {
            setCreatingAccountId(null);
        }
    };

    const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
        const ok = window.confirm(`Delete ${doctorName}? They will be moved to the recycle bin.`);
        if (!ok) return;

        setDeletingId(doctorId);
        setError("");
        setSuccess("");

        try {
            await nestApi.removeDoctor(doctorId);
            setSuccess(`${doctorName} moved to recycle bin.`);
            setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete doctor");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <p className="text-sm text-slate-500">Loading...</p>;
    }

    if (nonAdmin) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                Only ADMIN users can manage doctors.
            </div>
        );
    }

    return (
        <>
            <div className="animate-fade-up">
                <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manage Doctors</h1>
                    <p className="mt-1 text-sm text-slate-500 animate-fade-up-delay-1">Create accounts for existing doctors and remove doctors from the system.</p>
                </div>
            </div>

                {(error || success) && (
                    <div className="mt-4 space-y-2">
                        {error && <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                        {success && <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</div>}
                    </div>
                )}

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 animate-fade-up-delay-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-slate-900">Doctors</h2>
                        <p className="text-sm text-slate-500">{doctors.length} total</p>
                    </div>

                    {sortedDoctors.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                            No doctors found.
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {sortedDoctors.map((doctor) => (
                                <div key={doctor.id} className="rounded-xl border border-slate-200 px-4 py-3 smooth-card">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                                {doctor.image ? (
                                                    <Image src={doctor.image} alt={doctor.name} fill className="object-cover" />
                                                ) : (
                                                    <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
                                                        {doctorInitials(doctor.name)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-900">{doctor.name}</p>
                                                <p className="text-xs text-slate-500">{doctor.specialty}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isDoctorActive(doctor) ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                                                {isDoctorActive(doctor) ? "Active" : (doctor.status || "Inactive")}
                                            </span>
                                            {doctor.user?.email ? (
                                                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                                    Account: {doctor.user.email}
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                                    No account
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    

                                    {doctor.bio && <p className="mt-2 text-sm text-slate-600">{doctor.bio}</p>}

                                    <div className="mt-3 flex flex-wrap items-end gap-2">
                                        {!doctor.userId && (
                                            <button
                                                onClick={() => openAccountModal(doctor)}
                                                className="rounded-full border border-indigo-300 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 smooth-button"
                                            >
                                                Create Account
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                                            disabled={deletingId === doctor.id}
                                            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 smooth-button"
                                        >
                                            {deletingId === doctor.id ? "Deleting..." : "Delete Doctor"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {accountModalDoctor && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 animate-fade-in">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="my-6 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl animate-scale-in">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">Create Doctor Account</h2>
                                <button
                                    type="button"
                                    onClick={closeAccountModal}
                                    disabled={Boolean(creatingAccountId)}
                                    className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50 smooth-button"
                                >
                                    Close
                                </button>
                            </div>

                            <form onSubmit={handleCreateAccount} className="mt-4 space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Name</label>
                                    <input
                                        type="text"
                                        value={accountModalDoctor.name}
                                        readOnly
                                        className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-slate-100 px-3 text-sm text-slate-600 outline-none smooth-input"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Email</label>
                                    <input
                                        type="email"
                                        value={accountModalEmail}
                                        onChange={(e) => setAccountModalEmail(e.target.value)}
                                        className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring smooth-input"
                                        placeholder="doctor@clinic.com"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={creatingAccountId === accountModalDoctor.id}
                                    className="rounded-full bg-[#1a1aaa] px-5 py-2 text-sm font-semibold text-white hover:bg-[#111188] disabled:opacity-60 smooth-button"
                                >
                                    {creatingAccountId === accountModalDoctor.id ? "Creating..." : "Create Account"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
