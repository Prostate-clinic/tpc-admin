"use client";

import { useAuth } from "@/contexts/AuthContext";
import { nestApi, BlogPost, PaginationMeta } from "@/lib/nest-api";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  RefreshCw,
  Tag,
  Trash2,
  ToggleLeft,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AllBlogsPage() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  async function load(pageNum: number = 1) {
    setLoading(true);
    setError("");
    try {
      const data = await nestApi.getBlogs(pageNum, 12);
      setBlogs(data.blogs ?? []);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog post? This cannot be undone.")) return;
    setActionId(id);
    try {
      await nestApi.deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleToggle(id: string) {
    setActionId(id);
    try {
      const data = await nestApi.toggleBlogStatus(id);
      setBlogs((prev) => prev.map((b) => (b.id === id ? data.blog : b)));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Blog Posts</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pagination ? (
              <>
                {pagination.total} total • page {page} of {pagination.totalPages}
              </>
            ) : (
              "Loading…"
            )}
          </p>
        </div>
        <button
          onClick={() => load(page)}
          disabled={loading}
          className="flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !blogs.length ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
          <BookOpen className="h-10 w-10 opacity-40" />
          <p className="text-sm">No blog posts yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog) => {
              const isOwn = user?.id === blog.authorId;
              const busy = actionId === blog.id;

              return (
                <div key={blog.id} className="smooth-card rounded-lg border border-slate-200 flex flex-col gap-3 p-2">
                {blog.coverImage && (
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    width={500}
                    height={500}
                    className="h-40 w-full rounded-lg object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {blog.title}
                  </h2>
                  <StatusBadge status={blog.status} />
                </div>
                <p className="line-clamp-2 text-xs text-slate-500">{blog.excerpt}</p>

                {blog.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {blog.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <User className="h-3 w-3" />
                  <span className="truncate">{blog.author?.name ?? "Unknown"}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/blogs/${blog.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Read
                  </Link>
                  {isAdmin && (
                    <button
                      onClick={() => handleToggle(blog.id)}
                      disabled={busy}
                      title="Toggle draft / published"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                    >
                      <ToggleLeft className="h-3.5 w-3.5" />
                      {blog.status === "DRAFT" ? "Publish" : "Draft"}
                    </button>
                  )}
                  {(isAdmin || isOwn) && (
                    <button
                      onClick={() => handleDelete(blog.id)}
                      disabled={busy}
                      title="Delete post"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                  {!isAdmin && isOwn && blog.status === "DRAFT" && (
                    <PublishOwnButton blogId={blog.id} onDone={(updated) =>
                      setBlogs((prev) => prev.map((b) => (b.id === blog.id ? updated : b)))
                    } />
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => load(p)}
                    disabled={loading}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      page === p
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => load(page + 1)}
                disabled={page >= pagination.totalPages || loading}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === "PUBLISHED" ? (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
      <Globe className="h-3 w-3" />
      Published
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
      Draft
    </span>
  );
}

function PublishOwnButton({
  blogId,
  onDone,
}: {
  blogId: string;
  onDone: (b: BlogPost) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function handle() {
    if (!confirm("Publish this post?")) return;
    setBusy(true);
    try {
      const data = await nestApi.updateBlogStatus(blogId, "PUBLISHED");
      onDone(data.blog);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={handle}
      disabled={busy}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-50"
    >
      <Globe className="h-3.5 w-3.5" />
      Publish
    </button>
  );
}
