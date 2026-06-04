"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi } from "@/lib/nest-api";

export default function ProfilePage() {
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError("");
    setImageSuccess("");

    if (!isDoctor) {
      setImageError("Backend currently allows display-picture update for doctors only.");
      return;
    }

    if (!profileImage) {
      setImageError("Please select an image before uploading.");
      return;
    }

    setUploadingImage(true);
    try {
      await nestApi.updateDoctorDisplayPicture(profileImage);
      setImageSuccess("Profile image updated successfully.");
      setProfileImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to update profile image");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your account settings.</p>

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
        <p className="mt-1 text-xs text-slate-500">Endpoint support in current backend docs: doctors only.</p>

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

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Profile Image</h2>
        <p className="mt-1 text-xs text-slate-500">Endpoint support in current backend docs: doctors only.</p>

        <form onSubmit={handleImageUpload} className="mt-4">
          {imageError && <div className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{imageError}</div>}
          {imageSuccess && <div className="mb-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{imageSuccess}</div>}

          <div className="flex items-start gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-indigo-400 hover:bg-indigo-50"
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              ) : (
                <span className="text-xs text-slate-400 text-center px-2">Click to upload</span>
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
              <p className="text-xs text-slate-500">Accepted formats: JPG, PNG, WEBP.</p>
              {profileImage && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="max-w-[240px] truncate text-xs font-medium text-slate-700">{profileImage.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploadingImage}
            className="mt-4 rounded-full bg-[#1a1aaa] px-5 py-2 text-sm font-semibold text-white hover:bg-[#111188] disabled:opacity-60"
          >
            {uploadingImage ? "Uploading..." : "Update Profile Image"}
          </button>
        </form>
      </div>
    </div>
  );
}
