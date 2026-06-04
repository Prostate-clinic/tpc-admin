"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi } from "@/lib/nest-api";
import Image from "next/image";

type NewDoctorForm = {
    name: string;
    specialty: string;
    bio: string;
    accountEmail: string;
};

const initialForm: NewDoctorForm = {
    name: "",
    specialty: "",
    bio: "",
    accountEmail: "",
};

const doctorFirstNames = ["Amina", "Daniel", "Ifeoma", "Tunde", "Zainab", "Chinedu", "Mariam", "Kelechi"];
const doctorLastNames = ["Okafor", "Adebayo", "Ibrahim", "Nwosu", "Balogun", "Onyeka", "Musa", "Ojo"];
const specialties = ["Urology", "Radiology", "Oncology", "Nephrology", "General Surgery", "Diagnostics"];
const bioTemplates = [
    "Experienced clinician focused on evidence-based care and patient outcomes.",
    "Dedicated specialist with a strong interest in minimally invasive procedures.",
    "Passionate about preventive medicine, diagnostics, and long-term follow-up.",
];

export default function CreateDoctorPage() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState<NewDoctorForm>(initialForm);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isDevelopmentEnv =
        (process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || "").toLowerCase() === "development";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setProfileImage(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        } else {
            setImagePreview(null);
        }
    };

    if (user && user.role !== "ADMIN") {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                Only ADMIN users can create doctors.
            </div>
        );
    }

    const createDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await nestApi.createAdminDoctor({
                name: form.name,
                specialty: form.specialty,
                bio: form.bio || undefined,
                profileImage: profileImage ?? undefined,
                email: form.accountEmail.trim() || undefined,
            });

            if (form.accountEmail.trim()) {
                setSuccess("Doctor profile and account created successfully.");
            } else {
                setSuccess("Doctor profile created successfully.");
            }

            setForm(initialForm);
            setProfileImage(null);
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create doctor");
        } finally {
            setSaving(false);
        }
    };

    const autofillDummyData = () => {
        const firstName = doctorFirstNames[Math.floor(Math.random() * doctorFirstNames.length)];
        const lastName = doctorLastNames[Math.floor(Math.random() * doctorLastNames.length)];
        const specialty = specialties[Math.floor(Math.random() * specialties.length)];
        const bio = bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomSuffix}@clinic.com`;

        setForm({
            name: `Dr. ${firstName} ${lastName}`,
            specialty,
            bio,
            accountEmail: email,
        });
    };

    return (
        <div className="animate-fade-up">
            <h1 className="text-2xl font-bold text-slate-900">Create Doctor</h1>
            <p className="mt-1 text-sm text-slate-500 animate-fade-up-delay-1">Create a doctor profile and optionally create login account.</p>

            {(error || success) && (
                <div className="mt-4 space-y-2">
                    {error && <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                    {success && <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</div>}
                </div>
            )}

            <form onSubmit={createDoctor} className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 smooth-card animate-fade-up-delay-2">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Full Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring smooth-input"
                            placeholder="Dr. Jane Doe"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Specialty</label>
                        <input
                            type="text"
                            value={form.specialty}
                            onChange={(e) => setForm((prev) => ({ ...prev, specialty: e.target.value }))}
                            className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring smooth-input"
                            placeholder="Urology"
                            required
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Bio (optional)</label>
                        <textarea
                            value={form.bio}
                            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                            className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-300 focus:ring smooth-input"
                            placeholder="Short professional biography"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Profile Picture (optional)</label>
                        <div className="mt-1 flex items-start gap-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-indigo-400 hover:bg-indigo-50"
                            >
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                ) : (
                                    <span className="text-xs text-slate-400">Click to upload</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <p className="text-xs text-slate-500">
                                    Accepted formats: JPG, PNG, WEBP. Image will be uploaded to the server.
                                </p>
                                {profileImage && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="max-w-[200px] truncate text-xs font-medium text-slate-700">{profileImage.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => { setProfileImage(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Account Email (optional)</label>
                        <input
                            type="email"
                            value={form.accountEmail}
                            onChange={(e) => setForm((prev) => ({ ...prev, accountEmail: e.target.value }))}
                            className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring smooth-input"
                            placeholder="doctor@clinic.com"
                        />
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    {isDevelopmentEnv && (
                        <button
                            type="button"
                            onClick={autofillDummyData}
                            disabled={saving}
                            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 smooth-button"
                        >
                            Autofill Dummy Data
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-full bg-[#1a1aaa] px-5 py-2 text-sm font-semibold text-white hover:bg-[#111188] disabled:opacity-60 smooth-button"
                    >
                        {saving ? "Saving..." : "Create Doctor"}
                    </button>
                </div>
            </form>
        </div>
    );
}
