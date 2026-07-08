export type StaffRole = "ADMIN" | "DOCTOR" | "FRONTDESK";

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  doctorId?: string;
  isFirstLogin?: boolean;
};

export type DoctorAdminRecord = {
  id: string;
  name: string;
  specialty: string;
  bio?: string | null;
  image?: string | null;
  status?: "ACTIVE" | "DELETED";
  isActive?: boolean;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "DOCTOR";
  } | null;
};

export type BlogStatus = "DRAFT" | "PUBLISHED";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  tags: string[];
  status: BlogStatus;
  authorId: string;
  author?: { id: string; name: string; email: string; role: StaffRole };
  createdAt: string;
  updatedAt: string;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_NEST_API_BASE_URL || "http://localhost:4000/api";
const STAFF_TOKEN_KEY = "imo_staff_token";

export function getStaffToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STAFF_TOKEN_KEY);
}

export function setStaffToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STAFF_TOKEN_KEY, token);
}

export function clearStaffToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STAFF_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token ?? getStaffToken();
  const headers = new Headers(options.headers || undefined);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join("\n")
      : payload?.message || payload?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export const nestApi = {
  loginStaff(email: string, password: string) {
    return request<{ access_token: string; user: StaffUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
      token: null,
    });
  },

  getStaffProfile(token?: string | null) {
    return request<StaffUser>("/auth/me", { method: "GET", token: token ?? undefined });
  },

  changePassword(currentPassword: string, newPassword: string) {
    return request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  },

  updateDoctorDisplayPicture(profileImage: File) {
    const token = getStaffToken();
    const formData = new FormData();
    formData.append("profileImage", profileImage);

    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    return fetch(`${API_BASE_URL}/doctors/me/display-picture`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    }).then(async (res) => {
      const contentType = res.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok) {
        const message = payload?.message || payload?.error || `Request failed (${res.status})`;
        throw new Error(message);
      }
      return payload as { message?: string; doctor?: DoctorAdminRecord };
    });
  },

  getAppointments(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<{ appointments: unknown[] }>(`/appointments${query}`, { method: "GET" });
  },

  updateAppointment(id: string, data: { status?: string; notes?: string }) {
    return request<{ appointment: unknown}>(`/appointments/${id}`, {
      method: "PATCH",
      body: data,
    });
  },

  getPayments() {
    return request<{ payments: unknown[] }>("/payments", { method: "GET" });
  },

  getSlots(doctorId?: string) {
    const query = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : "";
    return request<{ slots: unknown[] }>(`/slots${query}`, { method: "GET" });
  },

  createSlot(data: { date: string; startTime: string; endTime: string; doctorId?: string }) {
    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    return request<{ slot: unknown }>("/slots", {
      method: "POST",
      headers: { "x-idempotency-key": idempotencyKey },
      body: data,
    });
  },

  getAdminDoctors() {
    return request<{ doctors: DoctorAdminRecord[] }>("/admin/doctors", { method: "GET" });
  },

  createAdminDoctor(data: { name: string; specialty: string; bio?: string; image?: string; profileImage?: File, email?:string }) {
    const token = getStaffToken();
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("specialty", data.specialty);
    if (data.bio) formData.append("bio", data.bio);
    if (data.profileImage) {
      formData.append("profileImage", data.profileImage);
    } else if (data.image) {
      formData.append("image", data.image);
    }
    if (data.email) {
      formData.append("email", data.email);
    }

    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    return fetch(`${API_BASE_URL}/admin/doctors`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    }).then(async (res) => {
      const contentType = res.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok) {
        const message = payload?.message || payload?.error || `Request failed (${res.status})`;
        throw new Error(message);
      }
      return payload as { doctor: DoctorAdminRecord; message?: string };
    });
  },

  createDoctorAccount(doctorId: string, email: string) {
    return request<{ doctor: DoctorAdminRecord; message?: string }>(`/admin/doctors/${doctorId}/account`, {
      method: "POST",
      body: { email },
    });
  },

  removeDoctor(doctorId: string) {
    return request<{ message?: string }>(`/admin/doctors/${doctorId}`, {
      method: "DELETE",
    });
  },

  getDeletedDoctors() {
    return request<{ doctors: DoctorAdminRecord[] }>("/admin/doctors/recycle-bin", { method: "GET" });
  },

  // ── Blogs ────────────────────────────────────────────────────────────────
  getBlogs(page: number = 1, limit: number = 12) {
    return request<{ blogs: BlogPost[]; pagination: PaginationMeta }>(
      `/blogs?page=${page}&limit=${limit}`,
      { method: "GET" }
    );
  },

  getBlog(id: string) {
    return request<{ blog: BlogPost }>(`/blogs/${id}`, { method: "GET" });
  },

  getMyBlogs(page: number = 1, limit: number = 12) {
    return request<{ blogs: BlogPost[]; pagination: PaginationMeta }>(
      `/blogs/me?page=${page}&limit=${limit}`,
      { method: "GET" }
    );
  },

  createBlog(data: {
    title: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    coverImageFile?: File;
    tags?: string[];
    status?: "DRAFT" | "PUBLISHED";
  }) {
    const token = getStaffToken();
    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("excerpt", data.excerpt);
    formData.append("content", data.content);
    if (data.coverImageFile) {
      formData.append("coverImage", data.coverImageFile);
    } else if (data.coverImage) {
      formData.append("coverImage", data.coverImage);
    }
    if (data.tags?.length) {
      data.tags.forEach((tag) => formData.append("tags", tag));
    }
    if (data.status) formData.append("status", data.status);

    const headers = new Headers({ "x-idempotency-key": idempotencyKey });
    if (token) headers.set("Authorization", `Bearer ${token}`);

    return fetch(`${API_BASE_URL}/blogs`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    }).then(async (res) => {
      const contentType = res.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok) {
        const message = Array.isArray(payload?.message)
          ? payload.message.join("\n")
          : payload?.message || payload?.error || `Request failed (${res.status})`;
        throw new Error(message);
      }
      return payload as { blog: BlogPost };
    });
  },

  updateBlogStatus(id: string, status: "DRAFT" | "PUBLISHED") {
    return request<{ blog: BlogPost }>(`/blogs/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  toggleBlogStatus(id: string) {
    return request<{ blog: BlogPost }>(`/blogs/${id}/toggle-status`, { method: "PATCH" });
  },

  deleteBlog(id: string) {
    return request<{ message?: string }>(`/blogs/${id}`, { method: "DELETE" });
  },
};