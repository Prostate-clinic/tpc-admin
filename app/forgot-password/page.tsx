"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { nestApi } from "@/lib/nest-api";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await nestApi.forgotAdminPassword(email.trim());
      setSent(true);
      setError("");
      void res;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset link");
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
          <p className="max-w-md text-base leading-relaxed text-indigo-100/80">We&apos;ll email you a secure reset link to set a new password. The link expires in 20 minutes.</p>
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
            <h2 className="text-2xl font-bold text-slate-900">{sent ? "Check your email" : "Reset your password"}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {sent
                ? <>If an account exists for <span className="font-semibold text-slate-900">{email}</span>, a reset link is on its way. It expires in 20 minutes.</>
                : "Enter your admin email and we’ll send you a secure reset link."}
            </p>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {sent ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                Open the link we sent to <span className="font-semibold">{email}</span> to choose a new password.
              </p>
              <button type="button" onClick={() => setSent(false)} className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendLink} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none ring-4 ring-indigo-100 focus:border-indigo-500 focus:ring-indigo-100" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50">
                {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending link...</span> : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">Remembered? <Link href="/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}