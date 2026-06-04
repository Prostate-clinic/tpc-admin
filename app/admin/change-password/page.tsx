"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
      <p className="mt-1 text-sm text-slate-500">
        {user?.isFirstLogin
          ? "You must change your temporary password before continuing."
          : "Update your password."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

        <div className="space-y-4">
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
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 rounded-full bg-[#1a1aaa] px-5 py-2 text-sm font-semibold text-white hover:bg-[#111188] disabled:opacity-60"
        >
          {submitting ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
