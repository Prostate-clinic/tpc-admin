"use client";

import RichTextRenderer from "@/components/RichTextRenderer";
import { nestApi, BlogPost } from "@/lib/nest-api";
import {
    ArrowLeft,
    Calendar,
    Globe,
    Loader2,
    Tag,
    User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BlogDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        nestApi
            .getBlog(id)
            .then((data) => setBlog(data.blog))
            .catch((e: unknown) =>
                setError(e instanceof Error ? e.message : "Failed to load post")
            )
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-slate-400">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Loading post…
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="space-y-4 py-20 text-center">
                <p className="text-sm text-red-500">{error || "Post not found."}</p>
                <Link href="/admin/blogs" className="text-sm text-indigo-600 hover:underline">
                    ← Back to posts
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-up space-y-6 pb-16 p-4 lg:p-6">
            {/* Back */}
            <div className="flex items-center gap-3">
                <Link
                    href="/admin/blogs"
                    className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <span className="text-sm text-slate-500">Back to all posts</span>
            </div>

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Cover image */}
                {blog.coverImage && (
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <img
                            src={blog.coverImage}
                            alt={blog.title}
                            className="h-72 w-full object-cover"
                        />
                    </div>
                )}

                {/* Header */}
                <div className="space-y-3">
                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                        {blog.status === "PUBLISHED" ? (
                            <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                <Globe className="h-3 w-3" />
                                Published
                            </span>
                        ) : (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                                Draft
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold leading-tight text-slate-900">
                        {blog.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            {blog.author?.name ?? "Unknown author"}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {new Date(blog.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>

                    {/* Tags */}
                    {blog.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {blog.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                                >
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Excerpt */}
                    {blog.excerpt && (
                        <p className="rounded-xl border-l-4 border-indigo-300 bg-indigo-50 px-4 py-3 text-sm italic text-slate-600">
                            {blog.excerpt}
                        </p>
                    )}
                </div>

                {/* Divider */}
                <hr className="border-slate-200" />

                {/* Rich text content */}
                <RichTextRenderer
                    content={blog.content}
                    className="text-slate-800"
                />
            </div>
        </div>
    );
}
