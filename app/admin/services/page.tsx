"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nestApi, type Service } from "@/lib/nest-api";
import { Package, Plus, Pencil, Trash2, AlertCircle, CheckCircle, Clock, DollarSign, Tag, X } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

const CATEGORIES: Service["category"][] = ["SURGICAL", "CONSULTATION", "DIAGNOSTICS", "IMAGING"];

const CATEGORY_LABEL: Record<Service["category"], string> = {
  SURGICAL: "Surgical",
  CONSULTATION: "Consultation",
  DIAGNOSTICS: "Diagnostics",
  IMAGING: "Imaging",
};

const CATEGORY_BADGE: Record<Service["category"], string> = {
  SURGICAL: "bg-indigo-100 text-indigo-700",
  CONSULTATION: "bg-emerald-100 text-emerald-700",
  DIAGNOSTICS: "bg-amber-100 text-amber-700",
  IMAGING: "bg-sky-100 text-sky-700",
};

type FormState = {
  name: string;
  category: Service["category"];
  duration: string;
  price: string;
  description: string;
  focus: string;
};

const emptyForm: FormState = { name: "", category: "CONSULTATION", duration: "", price: "", description: "", focus: "" };

export default function ServicesPage() {
  const { user } = useAuth();
  const nonAdmin = user && user.role !== "ADMIN";

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(() => [...services].sort((a, b) => a.name.localeCompare(b.name)), [services]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await nestApi.getServices();
      setServices(res.services || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nonAdmin) { setLoading(false); return; }
    load();
  }, [nonAdmin]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); setError(""); };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      category: s.category,
      duration: String(s.duration),
      price: String(s.price),
      description: s.description || "",
      focus: (s.focus || []).join(", "),
    });
    setModalOpen(true);
    setError("");
  };
  const closeModal = () => { if (saving) return; setModalOpen(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.duration.trim() || !form.price.trim()) { setError("Name, duration and price are required."); return; }
    const duration = Number(form.duration);
    const price = Number(form.price);
    if (!Number.isFinite(duration) || duration <= 0) { setError("Duration must be a positive number (minutes)."); return; }
    if (!Number.isFinite(price) || price < 0) { setError("Price must be a valid number."); return; }
    const focusArr = form.focus.split(",").map((s) => s.trim()).filter(Boolean);
    setSaving(true); setError(""); setSuccess("");
    try {
      if (editing) {
        await nestApi.updateService(editing.id, {
          name: form.name.trim(),
          category: form.category,
          duration,
          price,
          description: form.description.trim() || null,
          focus: focusArr,
        });
        setSuccess(`"${form.name.trim()}" updated.`);
      } else {
        await nestApi.createService({
          name: form.name.trim(),
          category: form.category,
          duration,
          price,
          description: form.description.trim() || undefined,
          focus: focusArr,
        });
        setSuccess(`"${form.name.trim()}" created.`);
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save service"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true); setError("");
    try {
      await nestApi.deleteService(confirmDelete.id);
      setSuccess(`"${confirmDelete.name}" removed.`);
      setConfirmDelete(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to delete"); }
    finally { setDeleting(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" /></div>;
  if (nonAdmin) return <div className="flex items-center justify-center py-20"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><AlertCircle className="mx-auto h-8 w-8 text-red-400" /><p className="mt-2 text-sm text-red-700">Only admins can manage services.</p></div></div>;

  return (
    <div className="animate-fade-up p-4 lg:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100"><Package className="h-5 w-5 text-indigo-600" /></span> Services</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Manage clinical services shown on the public website. Add, edit or remove offerings.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {success && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle className="h-4 w-4 shrink-0" />{success}</div>}

      {sorted.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">No services yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first service to show it on the public site.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((s) => (
            <div key={s.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold leading-tight text-slate-900">{s.name}</h3>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_BADGE[s.category]}`}>{CATEGORY_LABEL[s.category]}</span>
              </div>
              {s.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{s.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><Clock className="h-3 w-3" />{s.duration} min</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700"><DollarSign className="h-3 w-3" />₦{Number(s.price).toLocaleString()}</span>
              </div>
              {s.focus?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.focus.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"><Tag className="h-3 w-3" />{f}</span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                <button onClick={() => openEdit(s)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={() => setConfirmDelete(s)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit Service" : "Add Service"}</h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Robotic Radical Prostatectomy" className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Service["category"] })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Duration (min) *</label>
                  <input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="60" className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Price (NGN) *</label>
                <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="50000" className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description shown on the public site" rows={3} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Focus tags <span className="font-normal text-slate-400">(comma separated)</span></label>
                <input value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} placeholder="Robotic, Oncology, Recovery" className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <button type="submit" disabled={saving} className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Save Changes" : "Create Service"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Remove service"
        message={confirmDelete ? <p>Remove <span className="font-semibold text-slate-900">{confirmDelete.name}</span>? It will be hidden from the public website.</p> : undefined}
        confirmLabel="Remove"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
      />
    </div>
  );
}
