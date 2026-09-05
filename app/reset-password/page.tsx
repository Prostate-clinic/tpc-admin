"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, X, Loader2, Lock } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { nestApi } from "@/lib/nest-api";

function getPasswordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[@$!%*?&._-]/.test(pw),
  };
}
function isStrongPassword(pw: string) {
  const c = getPasswordChecks(pw);
  return c.length && c.upper && c.lower && c.number && c.special;
}

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"validating" | "valid" | "invalid">("validating");
  const [validateMessage, setValidateMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!email || !token) {
        setStatus("invalid");
        setValidateMessage("This reset link is invalid. Please request a new one.");
        return;
      }
      try {
        const res = await nestApi.validateAdminResetToken(email, token);
        if (cancelled) return;
        if (res.valid) setStatus("valid");
        else {
          setStatus("invalid");
          setValidateMessage(res.message || "This reset link is invalid. Please request a new one.");
        }
      } catch {
        if (cancelled) return;
        setStatus("invalid");
        setValidateMessage("This reset link is invalid. Please request a new one.");
      }
    })();
    return () => { cancelled = true; };
  }, [email, token]);

  const checks = getPasswordChecks(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canReset = isStrongPassword(newPassword) && passwordsMatch;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isStrongPassword(newPassword)) { setError("Password does not meet strength requirements."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await nestApi.resetAdminPassword(email, token, newPassword);
      setSuccess(res.message || "Password reset successfully.");
      setTimeout(() => { window.location.href = "/login"; }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 lg:flex">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-1 flex-col justify-center px-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">TPC Admin</p>
              <p className="text-xs text-indigo-200">Management Portal</p>
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white">Secure<br /><span className="text-indigo-200">Password Recovery</span></h1>
          <p className="max-w-md text-base leading-relaxed text-indigo-100/80">Choose a new password to regain access to your admin account.</p>
        </div>
        <div className="relative z-10 px-16 pb-8"><p className="text-xs text-indigo-200/50">© {new Date().getFullYear()} Imo Robotic Surgery and Oncology Center</p></div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Set a new password</h2>
            <p className="mt-2 text-sm text-slate-500">
              {email ? <>Resetting the password for <span className="font-semibold text-slate-900">{email}</span>.</> : "Choose a strong password to continue."}
            </p>
          </div>

          {status === "validating" && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking reset link...
            </div>
          )}

          {status === "invalid" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{validateMessage}</div>
          )}

          {status === "valid" && (
            <>
              {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" required className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 text-sm outline-none ring-4 ring-indigo-100 focus:border-indigo-500 focus:ring-indigo-100" />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {[
                      { ok: checks.length, label: "8+ characters" },
                      { ok: checks.upper, label: "Uppercase" },
                      { ok: checks.lower, label: "Lowercase" },
                      { ok: checks.number, label: "Number" },
                      { ok: checks.special, label: "Special char" },
                    ].map((c) => (
                      <span key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? "text-emerald-600" : "text-slate-400"}`}>
                        {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {c.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm new password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 text-sm outline-none ring-4 ring-indigo-100 focus:border-indigo-500 focus:ring-indigo-100" />
                  </div>
                  {confirmPassword && (
                    <p className={`mt-1 text-xs ${passwordsMatch ? "text-emerald-600" : "text-red-600"}`}>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</p>
                  )}
                </div>

                <button type="submit" disabled={loading || !canReset} className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</span> : "Save new password"}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <ResetPasswordPageInner />
    </Suspense>
  );
}