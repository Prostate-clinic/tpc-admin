"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in a destructive (red) style. */
  danger?: boolean;
  /** Disables both buttons while an async action is running. */
  busy?: boolean;
  /** When set, shows a textarea for gathering free-form input (e.g. a reason). */
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  /** Inline error shown inside the dialog (replaces window.alert for failures). */
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  inputLabel,
  inputPlaceholder,
  inputValue,
  onInputChange,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={() => !busy && onClose()}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {message && <div className="mt-3 text-sm leading-6 text-slate-600">{message}</div>}

        {inputLabel && (
          <label className="mt-4 grid gap-1">
            <span className="text-xs font-semibold text-slate-600">{inputLabel}</span>
            <textarea
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              maxLength={500}
              autoFocus
              className="min-h-20 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </label>
        )}

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
