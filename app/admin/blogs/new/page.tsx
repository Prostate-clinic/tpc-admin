"use client";

import { useAuth } from "@/contexts/AuthContext";
import { nestApi } from "@/lib/nest-api";
import {
    ArrowLeft,
    BookOpen,
    Eye,
    Globe,
    Loader2,
    PenLine,
    Save,
    Tag,
    Wand2,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

export default function NewBlogPage() {
    const { user } = useAuth();
    const router = useRouter();
    const isAdmin = user?.role === "ADMIN";

    const [form, setForm] = useState({
        title: "",
        excerpt: "",
        content: "",
        coverImage: "",
        tagsRaw: "",
        status: "DRAFT" as "DRAFT" | "PUBLISHED",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    function set(key: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function fillDummy() {
        const samples = [
            {
                title: "Understanding Prostate Cancer: Early Detection Saves Lives",
                excerpt: "Prostate cancer is one of the most common cancers in men, but early detection dramatically improves outcomes. Learn what every man should know.",
                tagsRaw: "prostate cancer, oncology, men's health, early detection",
                content: `<h1>Understanding Prostate Cancer: Early Detection Saves Lives</h1>
<p>Prostate cancer affects approximately 1 in 8 men during their lifetime, making it one of the most prevalent malignancies worldwide. Despite its prevalence, the prognosis for prostate cancer detected at an early, localised stage is excellent — with survival rates exceeding 99% at five years.</p>
<h2>What Is the Prostate?</h2>
<p>The prostate is a small, walnut-shaped gland in the male reproductive system. It sits just below the bladder and surrounds part of the urethra. Its primary function is to produce seminal fluid that nourishes and transports sperm.</p>
<h2>Risk Factors You Should Know</h2>
<ul>
<li><strong>Age</strong> — Risk increases significantly after age 50.</li>
<li><strong>Family history</strong> — A first-degree relative with prostate cancer doubles your risk.</li>
<li><strong>Ethnicity</strong> — African men have a higher incidence compared to other groups.</li>
<li><strong>Diet</strong> — High-fat, low-fibre diets have been linked to increased risk.</li>
</ul>
<h2>Symptoms to Watch For</h2>
<p>Early prostate cancer often presents <em>no symptoms at all</em>, which is why routine screening is critical. As the disease progresses, you may notice:</p>
<ul>
<li>Frequent or urgent need to urinate, especially at night</li>
<li>Weak or interrupted urine flow</li>
<li>Blood in urine or semen</li>
<li>Discomfort in the pelvic region</li>
<li>Painful ejaculation</li>
</ul>
<blockquote>Early detection is the single most powerful weapon we have against prostate cancer. A simple PSA blood test can identify abnormalities years before symptoms develop.</blockquote>
<h2>Screening and Diagnosis</h2>
<p>The two main screening tools are:</p>
<ol>
<li><strong>PSA (Prostate-Specific Antigen) test</strong> — A blood test measuring protein produced by the prostate. Elevated levels may indicate cancer, benign prostatic hyperplasia, or infection.</li>
<li><strong>Digital Rectal Examination (DRE)</strong> — A physical examination allowing the clinician to assess the size and texture of the prostate.</li>
</ol>
<p>If screening results are abnormal, further investigation — including an MRI and biopsy — will be recommended.</p>
<h2>Treatment Options</h2>
<p>Treatment depends on the stage, grade, and individual patient factors. Options range from active surveillance for low-risk cases to surgery, radiation therapy, hormone therapy, and chemotherapy for advanced disease.</p>
<h2>Conclusion</h2>
<p>Awareness and early action are your greatest allies. We encourage all men aged 50 and above — or 45 if you have risk factors — to speak with their doctor about prostate cancer screening today.</p>`,
            },
            {
                title: "Robotic Surgery in Urology: Precision, Recovery and the Future",
                excerpt: "Robotic-assisted urological surgery is transforming patient outcomes. Discover how this technology is reshaping prostate and kidney procedures.",
                tagsRaw: "robotic surgery, urology, minimally invasive, technology",
                content: `<h1>Robotic Surgery in Urology: Precision, Recovery and the Future</h1>
<p>The past two decades have witnessed a paradigm shift in urological surgery. Robotic-assisted platforms — most notably the da Vinci Surgical System — have moved from experimental to standard of care for many urological procedures, delivering precision that the human hand alone cannot match.</p>
<h2>How Robotic Surgery Works</h2>
<p>The surgeon operates from a console equipped with high-definition 3D vision and hand controls that translate natural movements into precise, scaled micro-movements of the robotic instruments inside the patient. A separate surgical cart holds the robotic arms, each tipped with specialised instruments.</p>
<h2>Key Urological Procedures</h2>
<ul>
<li><strong>Robotic Radical Prostatectomy</strong> — The gold standard for localised prostate cancer, offering excellent cancer control with reduced blood loss and faster recovery.</li>
<li><strong>Robotic Partial Nephrectomy</strong> — Kidney-sparing surgery for renal tumours, preserving renal function.</li>
<li><strong>Robotic Pyeloplasty</strong> — Correction of ureteropelvic junction obstruction.</li>
<li><strong>Robotic Cystectomy</strong> — Bladder removal for advanced bladder cancer.</li>
</ul>
<h2>Advantages Over Open Surgery</h2>
<blockquote>Patients undergoing robotic prostatectomy typically leave hospital within 24 hours and return to normal activities in two to four weeks — compared to six to eight weeks for open surgery.</blockquote>
<ul>
<li>Smaller incisions and reduced scarring</li>
<li>Significantly less blood loss</li>
<li>Lower risk of infection</li>
<li>Shorter hospital stay</li>
<li>Faster return to continence and erectile function</li>
</ul>
<h2>Is Robotic Surgery Right for You?</h2>
<p>Candidacy depends on cancer staging, overall health, BMI, and prior surgical history. Our multidisciplinary team conducts a thorough assessment before recommending the most appropriate surgical approach.</p>
<h2>Looking Ahead</h2>
<p>Next-generation platforms incorporating artificial intelligence for real-time tissue identification and haptic feedback are already in clinical trials, promising to push precision and safety even further.</p>`,
            },
            {
                title: "Managing BPH: When Is It Time to Seek Treatment?",
                excerpt: "Benign prostatic hyperplasia affects most men over 60. Find out when lifestyle changes are enough and when medical or surgical intervention is warranted.",
                tagsRaw: "BPH, benign prostatic hyperplasia, urology, men's health",
                content: `<h1>Managing BPH: When Is It Time to Seek Treatment?</h1>
<p>Benign prostatic hyperplasia (BPH) — the non-cancerous enlargement of the prostate gland — is one of the most common conditions affecting men over the age of 50. While it is not life-threatening, BPH can significantly diminish quality of life through its impact on urinary function.</p>
<h2>Understanding BPH</h2>
<p>As men age, the prostate naturally enlarges. When this growth compresses the urethra, it restricts urine flow, leading to a constellation of lower urinary tract symptoms (LUTS).</p>
<h2>Common Symptoms</h2>
<ul>
<li>Frequent urination, particularly at night (nocturia)</li>
<li>Urgency — a sudden, strong urge to urinate</li>
<li>Weak or slow urinary stream</li>
<li>Difficulty starting urination (hesitancy)</li>
<li>Feeling of incomplete bladder emptying</li>
<li>Urinary dribbling after finishing</li>
</ul>
<h2>Grading Severity</h2>
<p>Clinicians use the <strong>International Prostate Symptom Score (IPSS)</strong> — a validated questionnaire — to categorise BPH as mild (0–7), moderate (8–19), or severe (20–35). This score, combined with flow rate studies and ultrasound, guides treatment decisions.</p>
<h2>Treatment Ladder</h2>
<ol>
<li><strong>Watchful waiting</strong> — Appropriate for mild symptoms with no complications.</li>
<li><strong>Lifestyle modifications</strong> — Reducing evening fluid intake, limiting caffeine and alcohol, bladder training.</li>
<li><strong>Medical therapy</strong> — Alpha-blockers (e.g., tamsulosin) relax the prostate smooth muscle; 5-alpha reductase inhibitors (e.g., finasteride) shrink the gland over time.</li>
<li><strong>Minimally invasive procedures</strong> — UroLift, Rezūm water vapour therapy.</li>
<li><strong>Surgery</strong> — TURP (transurethral resection of the prostate) remains the gold standard for moderate-to-severe BPH resistant to medication.</li>
</ol>
<blockquote>Untreated severe BPH can lead to urinary retention, bladder stones, and kidney damage. Do not dismiss persistent urinary symptoms as simply "part of ageing".</blockquote>
<h2>When to See a Specialist</h2>
<p>Seek prompt evaluation if you experience inability to urinate, blood in urine, recurrent urinary tract infections, or kidney problems. Early specialist involvement leads to better long-term urinary outcomes.</p>`,
            },
        ];

        const pick = samples[Math.floor(Math.random() * samples.length)];
        setForm((prev) => ({
            ...prev,
            title: pick.title,
            excerpt: pick.excerpt,
            tagsRaw: pick.tagsRaw,
            content: pick.content,
        }));
    }

    // Strip HTML tags to count words/chars for display purposes
    const plainText = form.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    const charCount = plainText.length;
    const tags = form.tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;

        const title = form.title.trim();
        const excerpt = form.excerpt.trim();
        const content = form.content.trim();

        if (!title) {
            setError("Title is required.");
            return;
        }
        if (title.length < 3 || title.length > 200) {
            setError("Title must be between 3 and 200 characters.");
            return;
        }
        if (!excerpt) {
            setError("Excerpt is required.");
            return;
        }
        if (!content || content === "<p></p>") {
            setError("Content is required.");
            return;
        }
        const plainContent = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (plainContent.length < 20) {
            setError("Content must be at least 20 characters.");
            return;
        }

        setError("");
        setSubmitting(true);
        try {
            await nestApi.createBlog({
                title,
                excerpt,
                content,
                coverImageFile: coverFile ?? undefined,
                tags: tags.length ? tags : undefined,
                status: form.status,
            });
            router.push("/admin/blogs/my-posts");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to create blog post");
        } finally {
            setSubmitting(false);
        }
    }

    const titleProgress = form.title.length > 0 ? 50 : 0;
    const excerptProgress = form.excerpt.length > 0 ? 25 : 0;
    const contentProgress = form.content.length > 0 ? 15 : 0;
    const coverProgress = coverFile ? 10 : 0;
    const totalProgress = titleProgress + excerptProgress + contentProgress + coverProgress;

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setCoverFile(file);
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setCoverPreview(previewUrl);
        } else {
            setCoverPreview("");
        }
    }

    function clearCover() {
        setCoverFile(null);
        setCoverPreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <div className="animate-fade-up space-y-5 p-4 lg:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/blogs"
                        className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
                            <BookOpen className="h-7 w-7 text-indigo-600" />
                            New Blog Post
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {isAdmin
                                ? "Create and publish instantly or save as draft."
                                : "Share your expertise. Drafts can be published anytime."}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={fillDummy}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                >
                    <Wand2 className="h-4 w-4" />
                    Fill with sample
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-shake">
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="whitespace-pre-line">
                        <p className="font-medium">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid gap-5 xl:grid-cols-3">
                {/* Form Column */}
                <form onSubmit={handleSubmit} className="xl:col-span-2 space-y-5">
                    {/* Title */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-900">
                            Post Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            placeholder="e.g., Advances in Robotic Urology…"
                            maxLength={120}
                            className="smooth-input w-full text-base outline-0 border border-slate-300 p-2 rounded-xl focus:border-indigo-600"
                        />
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-900">
                            Excerpt <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.excerpt}
                            onChange={(e) => set("excerpt", e.target.value)}
                            placeholder="A compelling summary that appears in blog listings and previews…"
                            maxLength={200}
                            rows={3}
                            className="smooth-input w-full resize-none outline-0 border border-slate-300 p-2 rounded-xl focus:border-indigo-600"
                        />
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-900">Cover Image</label>
                        {coverPreview && (
                            <div className="relative h-32 overflow-hidden rounded-lg border border-slate-200">
                                <img
                                    src={coverPreview}
                                    alt="Cover preview"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                className="smooth-input w-full cursor-pointer outline-0 border border-slate-300 p-2 rounded-xl focus:border-indigo-600"
                            />
                            {coverFile && (
                                <button
                                    type="button"
                                    onClick={clearCover}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        {coverFile && <p className="text-xs text-slate-500">Selected: {coverFile.name}</p>}
                        <div className="text-xs text-slate-400">
                            Optimal size: 1200 × 600px. High-quality images increase engagement.
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-900">Topics</label>
                        <input
                            type="text"
                            value={form.tagsRaw}
                            onChange={(e) => set("tagsRaw", e.target.value)}
                            placeholder="e.g., urology, robotics, surgery"
                            className="smooth-input w-full outline-0 border border-slate-300 p-2 rounded-xl focus:border-indigo-600"
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                                    >
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="text-xs text-slate-400">
                            Separate topics with commas. Helps readers discover your post.
                        </div>
                    </div>

                    {/* Status */}
                    {isAdmin && (
                        <div className="smooth-card space-y-3">
                            <label className="block text-sm font-semibold text-slate-900">Publish Now?</label>
                            <div className="flex gap-4">
                                {(["DRAFT", "PUBLISHED"] as const).map((s) => (
                                    <label
                                        key={s}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition"
                                        style={{
                                            borderColor: form.status === s ? "#6366f1" : "#e2e8f0",
                                            backgroundColor: form.status === s ? "#eef2ff" : "#f9fafb",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="status"
                                            value={s}
                                            checked={form.status === s}
                                            onChange={() => set("status", s)}
                                            className="h-4 w-4 accent-indigo-600"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {s === "DRAFT" ? "Save as Draft" : "Publish Now"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {s === "DRAFT"
                                                    ? "Finish editing anytime"
                                                    : "Go live immediately"}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content Editor */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-900">
                            Article Content <span className="text-red-500">*</span>
                        </label>
                        <RichTextEditor
                            value={form.content}
                            onChange={(html) => set("content", html)}
                            placeholder="Start writing your article here… Use the toolbar for headings, bold, lists, and more."
                            minHeight={380}
                            disabled={submitting}
                        />
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Rich text — use the toolbar to format your article</span>
                            <span>
                                {wordCount} words • {charCount} characters
                            </span>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <Link
                            href="/admin/blogs"
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {isAdmin && form.status === "PUBLISHED" ? "Publish" : "Save"}
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Sidebar */}
                <div className="xl:col-span-1 space-y-5">
                    {/* Progress Card */}
                    <div className="smooth-card space-y-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Eye className="h-4 w-4 text-indigo-600" />
                            Completeness
                        </h3>
                        <div className="space-y-2">
                            <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="bg-indigo-600 transition-all duration-300"
                                    style={{ width: `${totalProgress}%` }}
                                />
                            </div>
                            <p className="text-sm text-slate-600 font-medium">{totalProgress}% complete</p>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600">
                            <li className={`flex items-center gap-2 ${form.title ? "text-green-600" : ""}`}>
                                <div
                                    className={`h-2 w-2 rounded-full ${form.title ? "bg-green-600" : "bg-slate-300"}`}
                                />
                                {form.title ? "✓ Title added" : "Add a compelling title"}
                            </li>
                            <li className={`flex items-center gap-2 ${form.excerpt ? "text-green-600" : ""}`}>
                                <div
                                    className={`h-2 w-2 rounded-full ${form.excerpt ? "bg-green-600" : "bg-slate-300"}`}
                                />
                                {form.excerpt ? "✓ Excerpt added" : "Add an excerpt"}
                            </li>
                            <li className={`flex items-center gap-2 ${form.content ? "text-green-600" : ""}`}>
                                <div
                                    className={`h-2 w-2 rounded-full ${form.content ? "bg-green-600" : "bg-slate-300"}`}
                                />
                                {form.content ? "✓ Content added" : "Write your content"}
                            </li>
                            <li className={`flex items-center gap-2 ${coverFile ? "text-green-600" : "text-slate-400"}`}>
                                <div
                                    className={`h-2 w-2 rounded-full ${coverFile ? "bg-green-600" : "bg-slate-200"}`}
                                />
                                {coverFile ? "✓ Cover added" : "Add a cover image (optional)"}
                            </li>
                        </ul>
                    </div>

                    {/* Stats Card */}
                    <div className="smooth-card space-y-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <PenLine className="h-4 w-4 text-indigo-600" />
                            Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-indigo-50 p-3">
                                <p className="text-2xl font-bold text-indigo-600">{wordCount}</p>
                                <p className="text-xs text-slate-600">words</p>
                            </div>
                            <div className="rounded-lg bg-slate-100 p-3">
                                <p className="text-2xl font-bold text-slate-700">{charCount}</p>
                                <p className="text-xs text-slate-600">characters</p>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 italic">
                            ✓ Good length for engagement: 300+ words
                        </div>
                    </div>

                    {/* Tips Card */}
                    <div className="smooth-card space-y-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Globe className="h-4 w-4 text-indigo-600" />
                            Tips for Success
                        </h3>
                        <ul className="space-y-2 text-xs text-slate-600">
                            <li>• Use clear, descriptive titles</li>
                            <li>• Write engaging excerpts</li>
                            <li>• Add high-quality cover images</li>
                            <li>• Use relevant topics/tags</li>
                            <li>• Keep content well-structured</li>
                            <li>• Proofread before publishing</li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
}
