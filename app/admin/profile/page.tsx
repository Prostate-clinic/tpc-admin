"use client";

import { Camera, Loader2, Shield, User as UserIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi } from "@/lib/nest-api";
import Avatar from "@/components/Avatar";

export default function ProfilePage() {
  const { user, changePassword, refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageSuccess, setImageSuccess] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDoctor = user?.role === "DOCTOR";

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setPasswordError(""); setPasswordSuccess("");
    if (!isDoctor) { setPasswordError("Password change is only available for doctors."); return; }
    if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    if (currentPassword === newPassword) { setPasswordError("New password must be different."); return; }
    setUpdatingPassword(true);
    try { await changePassword(currentPassword, newPassword); setPasswordSuccess("Password changed successfully."); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    catch (err) { setPasswordError(err instanceof Error ? err.message : "Failed"); }
    finally { setUpdatingPassword(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null; if (!file || !isDoctor) return;
    setImageError(""); setImageSuccess(""); setUploadingImage(true);
    try { await nestApi.updateDoctorDisplayPicture(file); setImageSuccess("Profile image updated."); await refresh(); }
    catch (err) { setImageError(err instanceof Error ? err.message : "Failed"); }
    finally { setUploadingImage(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account settings.</p>
      </div>

      {imageError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{imageError}</div>}
      {imageSuccess && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{imageSuccess}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-5">
          {isDoctor ? (
            <button onClick={() => fileInputRef.current?.click()} className="group relative shrink-0" disabled={uploadingImage}>
              <Avatar src={user?.image} name={user?.name || "User"} size={80} />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadingImage ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
              </div>
            </button>
          ) : <Avatar src={user?.image} name={user?.name || "User"} size={80} />}
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{user?.role}</span>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><UserIcon className="h-5 w-5 text-slate-500" /></div>
          <h3 className="text-base font-semibold text-slate-900">Account Information</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[{ label: "Name", value: user?.name }, { label: "Email", value: user?.email }, { label: "Role", value: user?.role }, { label: "Doctor ID", value: user?.doctorId }].map((f) => (
            <div key={f.label} className="rounded-xl border border-slate-100 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{f.label}</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{f.value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100"><Shield className="h-5 w-5 text-indigo-600" /></div>
          <h3 className="text-base font-semibold text-slate-900">Change Password</h3>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{passwordError}</div>}
          {passwordSuccess && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{passwordSuccess}</div>}
          {[{ label: "Current Password", value: currentPassword, set: setCurrentPassword },
            { label: "New Password", value: newPassword, set: setNewPassword },
            { label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword }].map((f) => (
            <div key={f.label}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{f.label}</label>
              <input type="password" value={f.value} onChange={(e) => f.set(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-4 ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-indigo-100" required />
            </div>
          ))}
          <button type="submit" disabled={updatingPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50">
            {updatingPassword ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
