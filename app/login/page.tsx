"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Shield, ArrowRight, Mail, Lock } from "lucide-react";
import Image from "next/image";
import PasswordInput from "@/components/PasswordInput";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left: Branding */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800">
        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">TPC Admin</p>
              <p className="text-xs text-indigo-200">Management Portal</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight text-white mb-4">
            Imo Robotic Surgery<br />
            <span className="text-indigo-200">and Oncology Center</span>
          </h1>

          <p className="text-base text-indigo-100/80 max-w-md leading-relaxed">
            Manage appointments, doctors, and patient care from a single, powerful dashboard built for modern healthcare.
          </p>

          <div className="mt-12 space-y-4">
            {[
              "Real-time appointment management",
              "Doctor schedule configuration",
              "Secure patient communications",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                  <div className="h-2 w-2 rounded-full bg-indigo-200" />
                </div>
                <span className="text-sm text-indigo-100/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-16 pb-8">
          <p className="text-xs text-indigo-200/50">&copy; {new Date().getFullYear()} Imo Robotic Surgery and Oncology Center</p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <Image src="/logo.png" alt="" width={24} height={24} className="rounded" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">TPC Admin</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 mb-4">
              <Shield className="h-3.5 w-3.5 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-700">Staff Access Only</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-slate-500">Enter your credentials to access the admin panel</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-scale-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none ring-4 ring-indigo-100 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-100"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 text-sm text-slate-900 outline-none ring-4 ring-indigo-100 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-100"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="mt-1.5 flex justify-end">
                <a href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:underline">Forgot password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            <a href="/forgot-password" className="font-semibold text-indigo-600 hover:underline">Forgot your password?</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
