"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, Mail, ArrowLeft, Check, X, Loader2, KeyRound, Lock } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { nestApi } from "@/lib/nest-api";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = value.split("");
    while (next.length < 6) next.push("");
    next[idx] = digit;
    const newVal = next.join("").slice(0, 6);
    onChange(newVal);
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
  };
  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputsRef.current[idx + 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length) {
      e.preventDefault();
      onChange(pasted);
      const nextIdx = Math.min(pasted.length, 5);
      inputsRef.current[nextIdx]?.focus();
    }
  };
  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-11 rounded-xl border border-slate-300 bg-white text-center text-lg font-bold tracking-widest outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:h-12 sm:w-12"
        />
      ))}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const checks = getPasswordChecks(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canReset = otp.length === 6 && isStrongPassword(newPassword) && passwordsMatch;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await nestApi.forgotAdminPassword(email.trim());
      setSuccess(res.message || "Reset code sent to your email.");
      setStep("otp");
      setResendIn(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset code");
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (otp.length !== 6) { setError("Please enter the 6-digit code."); return; }
    if (!isStrongPassword(newPassword)) { setError("Password does not meet strength requirements."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await nestApi.resetAdminPassword(email.trim(), otp, newPassword);
      setSuccess(res.message || "Password reset successfully.");
      setTimeout(() => { window.location.href = "/login"; }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const res = await nestApi.forgotAdminPassword(email.trim());
      setSuccess(res.message || "Code resent.");
      setResendIn(60);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to resend"); }
    finally { setLoading(false); }
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
          <p className="max-w-md text-base leading-relaxed text-indigo-100/80">We’ll send a 6-digit code to your registered email to verify your identity before you set a new password.</p>
        </div>
        <div className="relative z-10 px-16 pb-8"><p className="text-xs text-indigo-200/50">© {new Date().getFullYear()} Imo Robotic Surgery and Oncology Center</p></div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>

          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">Forgot Password</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{step === "email" ? "Reset your password" : "Enter verification code"}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {step === "email" ? "Enter your admin email and we’ll send you a 6-digit code." : <>Code sent to <span className="font-semibold text-slate-900">{email}</span>. It expires in 10 minutes.</>}
            </p>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none ring-4 ring-indigo-100 focus:border-indigo-500 focus:ring-indigo-100" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50">
                {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending code...</span> : "Send reset code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">6-digit code</label>
                <OtpInput value={otp} onChange={setOtp} />
                <div className="mt-3 flex items-center justify-between">
                  <button type="button" onClick={() => setStep("email")} className="text-xs font-medium text-slate-500 hover:text-indigo-600">Change email</button>
                  <button type="button" onClick={handleResend} disabled={resendIn > 0 || loading} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:text-slate-400">
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
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
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
                  <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 text-sm outline-none ring-4 ring-indigo-100 focus:border-indigo-500 focus:ring-indigo-100" />
                </div>
                {confirmPassword && (
                  <p className={`mt-1 text-xs ${passwordsMatch ? "text-emerald-600" : "text-red-600"}`}>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</p>
                )}
              </div>

              <button type="submit" disabled={loading || !canReset} className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50">
                {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</span> : "Reset password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">Remembered? <Link href="/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
