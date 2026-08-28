"use client";

import { AlertCircle, X } from "lucide-react";

type ToastProps = {
  message: string | null;
  onDismiss: () => void;
};

/**
 * Inline replacement for `window.alert(...)`: renders the most recent error in
 * a dismissible banner at the top of the page instead of blocking on a native
 * dialog.
 */
export default function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[70] w-full max-w-md -translate-x-1/2 px-4">
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 shadow-lg">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
        <p className="flex-1 text-sm text-rose-700">{message}</p>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
