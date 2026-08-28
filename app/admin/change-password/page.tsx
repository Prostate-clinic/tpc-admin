"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2, ArrowRight, Check, X } from "lucide-react";
import Image from "next/image";
import PasswordInput from "@/components/PasswordInput";

function getChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[@$!%*?&._-]/.test(pw),
  };
}
function isStrong(pw: string) {
  const c = getChecks(pw);
  return c.length && c.upper && c.lower && c.number && c.special;
}

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checks = getChecks(newPassword);
  const match = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!isStrong(newPassword)) { setError("Password must be at least 8 characters and include uppercase, lowercase, number and special character."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (currentPassword === newPassword) { setError("New password must be different."); return; }
    setSubmitting(true);
    try { await changePassword(currentPassword, newPassword); setSuccess("Password changed successfully."); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center animate-fade-up">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
          <p className="mt-2 text-sm text-slate-500">
            {user?.isFirstLogin ? "You must change your temporary password before continuing." : "Update your password."}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          {success && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><Check className="h-4 w-4 shrink-0" />{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
              <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-4 ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
              <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="At least 8 characters"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-4 ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-indigo-100" />
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {[
                  { ok: checks.length, label: "8+ characters" },
                  { ok: checks.upper, label: "Uppercase" },
                  { ok: checks.lower, label: "Lowercase" },
                  { ok: checks.number, label: "Number" },
                  { ok: checks.special, label: "Special char" },
                ].map((c) => (
                  <span key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? "text-emerald-600" : "text-slate-400"}`}>{c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{c.label}</span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
              <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-4 ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-indigo-100" />
              {confirmPassword && <p className={`mt-1 text-xs ${match ? "text-emerald-600" : "text-red-600"}`}>{match ? "Passwords match" : "Passwords do not match"}</p>}
            </div>
            <button type="submit" disabled={submitting}
              className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Updating...</span> : <span className="flex items-center justify-center gap-2">Change Password <ArrowRight className="h-4 w-4" /></span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
