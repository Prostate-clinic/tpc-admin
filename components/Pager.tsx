"use client";

import type { PaginationMeta } from "@/lib/nest-api";

export default function Pager({
  pagination,
  onPage,
}: {
  pagination: PaginationMeta | null;
  onPage: (page: number) => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, total, totalPages } = pagination;
  const from = (page - 1) * (pagination.limit) + 1;
  const to = Math.min(page * pagination.limit, total);

  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
