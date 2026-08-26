"use client";

import { Camera, Check, Loader2 } from "lucide-react";
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
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!isDoctor) {
      setPasswordError("Backend currently allows password change from this UI for doctors only.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file || !isDoctor) return;

    setImageError("");
    setImageSuccess("");
    setUploadingImage(true);
    try {
      await nestApi.updateDoctorDisplayPicture(file);
      setImageSuccess("Profile image updated.");
      await refresh();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to update profile image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your account settings.</p>

      {imageError && <div className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{imageError}</div>}
      {imageSuccess && <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{imageSuccess}</div>}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          {isDoctor ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group relative shrink-0"
              disabled={uploadingImage}
            >
              <Avatar src={user?.image} name={user?.name || "User"} size={72} />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
            </button>
          ) : (
            <Avatar src={user?.image} name={user?.name || "User"} size={72} />
          )}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="mt-1 text-xs font-medium text-indigo-600 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Account Information</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-500">Name</p>
            <p className="mt-1 text-sm text-slate-800">{user?.name || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Email</p>
            <p className="mt-1 text-sm text-slate-800">{user?.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Role</p>
            <p className="mt-1 text-sm text-slate-800">{user?.role || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Doctor ID</p>
            <p className="mt-1 text-sm text-slate-800">{user?.doctorId || "-"}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Change Password</h2>

        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          {passwordError && <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{passwordError}</div>}
          {passwordSuccess && <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{passwordSuccess}</div>}

          <div>
            <label className="text-xs font-semibold text-slate-700">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-300 focus:ring"
              required
            />
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="rounded-full bg-[#1a1aaa] px-5 py-2 text-sm font-semibold text-white hover:bg-[#111188] disabled:opacity-60"
          >
            {updatingPassword ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
