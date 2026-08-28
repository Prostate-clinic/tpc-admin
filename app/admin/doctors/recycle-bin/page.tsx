"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { type DoctorAdminRecord, nestApi } from "@/lib/nest-api";
import Avatar from "@/components/Avatar";

export default function RecycleBinPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [doctors, setDoctors] = useState<DoctorAdminRecord[]>([]);

    const nonAdmin = user && user.role !== "ADMIN";

    const sortedDoctors = useMemo(
        () => [...doctors].sort((a, b) => a.name.localeCompare(b.name)),
        [doctors],
    );

    useEffect(() => {
        if (nonAdmin) { setLoading(false); return; }

        setLoading(true);
        nestApi.getDeletedDoctors()
            .then((res) => setDoctors(res.doctors || []))
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load deleted doctors"))
            .finally(() => setLoading(false));
    }, [nonAdmin]);

    if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

    if (nonAdmin) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                Only ADMIN users can view the recycle bin.
            </div>
        );
    }

    return (
        <div className="animate-fade-up p-4 lg:p-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Recycle Bin</h1>
                <p className="mt-1 text-sm text-slate-500 animate-fade-up-delay-1">
                    Doctors that have been soft-deleted. Their records are preserved here.
                </p>
            </div>

            {error && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 animate-fade-up-delay-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">Deleted Doctors</h2>
                    <p className="text-sm text-slate-500">{doctors.length} record{doctors.length !== 1 ? "s" : ""}</p>
                </div>

                {sortedDoctors.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Recycle bin is empty.
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {sortedDoctors.map((doctor) => (
                            <div key={doctor.id} className="rounded-xl border border-slate-200 px-4 py-3 smooth-card opacity-80">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Avatar src={doctor.image} name={doctor.name} size={40} />
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-slate-700">{doctor.name}</p>
                                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                                                Deleted
                                            </span>
                                            {doctor.user?.email && (
                                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                                                    {doctor.user.email}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400">{doctor.specialty}</p>
                                    </div>
                                </div>
                                {doctor.bio && (
                                    <p className="mt-2 text-sm text-slate-500">{doctor.bio}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
