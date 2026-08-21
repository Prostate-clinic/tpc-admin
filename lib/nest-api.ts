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

// ── Booking engine ─────────────────────────────────────────────────────────
//
// Slots are COMPUTED by the backend from a doctor's weekly schedule; they are
// not rows and cannot be created. `ScheduleBlock` is the thing you configure;
// `Slot` is the thing that falls out of it.

/** 0 = Sunday … 6 = Saturday. Times are clinic-local `HH:mm`. */
export type ScheduleBlock = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
};

export type Slot = {
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

/** When `slots` is empty, `reason` says why — so the UI can be specific. */
export type UnavailableReason =
  | "HOLIDAY"
  | "ON_LEAVE"
  | "NOT_WORKING"
  | "DAILY_LIMIT_REACHED"
  | "OUTSIDE_BOOKING_WINDOW"
  | "FULLY_BOOKED"
  | null;

export type AvailabilityDay = {
  date: string;
  slots: Slot[];
  reason: UnavailableReason;
};

export type BlockedTimeReason =
  | "SURGERY"
  | "WARD_ROUNDS"
  | "MEETING"
  | "LUNCH"
  | "EMERGENCY"
  | "ADMIN_OVERRIDE"
  | "OTHER";

export type BlockedTime = {
  id: string;
  startAt: string;
  endAt: string;
  reason: BlockedTimeReason;
  note?: string | null;
};

export type ExceptionType =
  | "VACATION"
  | "PUBLIC_HOLIDAY"
  | "CONFERENCE"
  | "EMERGENCY_LEAVE"
  | "PERSONAL_LEAVE"
  | "HALF_DAY"
  | "CUSTOM_HOURS";

export type ScheduleException = {
  id: string;
  type: ExceptionType;
  startDate: string;
  endDate: string;
  startMinute?: number | null;
  endMinute?: number | null;
  reason?: string | null;
};

export type ConsultationType = {
  id: string;
  name: string;
  durationMinutes: number;
  fee: string;
  isVideo: boolean;
};

/**
 * The full clinical lifecycle. Note there is no longer a `CLOSED` status — it
 * was ambiguous (closed by whom? did the patient attend?) and is replaced by the
 * distinct outcomes COMPLETED, CANCELLED, REJECTED and NO_SHOW.
 */
export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "NO_SHOW";

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

  /**
   * `status` accepts one status or a list (sent comma-separated); omit for
   * everything. Paginated: pass `page`/`limit` (max 100), read `pagination`.
   */
  getAppointments(status?: AppointmentStatus | AppointmentStatus[], page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", (Array.isArray(status) ? status : [status]).join(","));
    }
    params.set("page", String(page));
    params.set("limit", String(limit));
    return request<{ appointments: unknown[]; pagination: PaginationMeta }>(
      `/appointments?${params.toString()}`,
      { method: "GET" },
    );
  },

  /** The signed-in doctor's own appointments. Same contract as getAppointments. */
  getMyAppointments(status?: AppointmentStatus | AppointmentStatus[], page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", (Array.isArray(status) ? status : [status]).join(","));
    }
    params.set("page", String(page));
    params.set("limit", String(limit));
    return request<{ appointments: unknown[]; pagination: PaginationMeta }>(
      `/appointments/my-schedule?${params.toString()}`,
      { method: "GET" },
    );
  },

  /**
   * PENDING → CONFIRMED. A new booking holds its slot for only 30 minutes;
   * confirming it (once payment is settled) turns the hold into a commitment.
   */
  confirmAppointment(id: string, paymentReference?: string) {
    return request<{ appointment: unknown }>(`/appointments/${id}/confirm`, {
      method: "POST",
      body: paymentReference ? { paymentReference } : {},
    });
  },

  /**
   * The clinic-wide audit feed. Every action on every appointment — who did
   * what, when, and to which booking. Admin only. Paginated.
   */
  getActivityLog(
    filters?: { action?: string; actorType?: string },
    page = 1,
    limit = 20,
  ) {
    const params = new URLSearchParams();
    if (filters?.action) params.set("action", filters.action);
    if (filters?.actorType) params.set("actorType", filters.actorType);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return request<{ entries: unknown[]; pagination: PaginationMeta }>(
      `/appointments/activity?${params.toString()}`,
      { method: "GET" },
    );
  },

  /**
   * Moves an appointment through the clinical lifecycle. The backend enforces a
   * transition table, so an illegal move (e.g. re-opening a COMPLETED
   * appointment) comes back as a 409 rather than silently corrupting state.
   */
  updateAppointmentStatus(id: string, status: AppointmentStatus, reason?: string) {
    return request<{ appointment: unknown }>(`/appointments/${id}/status`, {
      method: "PATCH",
      body: { status, reason },
    });
  },

  cancelAppointment(id: string, reason?: string, overrideNotice?: boolean) {
    return request<{ appointment: unknown }>(`/appointments/${id}/cancel`, {
      method: "PATCH",
      body: { reason, overrideNotice },
    });
  },

  rescheduleAppointment(id: string, startAt: string, reason?: string) {
    return request<{ appointment: unknown }>(`/appointments/${id}/reschedule`, {
      method: "PATCH",
      body: { startAt, reason },
    });
  },

  getPayments() {
    return request<{ payments: unknown[] }>("/payments", { method: "GET" });
  },

  // ── Schedules ────────────────────────────────────────────────────────────
  //
  // `POST /slots` is gone. Doctors no longer hand-create slots: they declare a
  // recurring weekly schedule, and the backend computes every bookable slot
  // from it (minus leave, holidays, blocked time and existing appointments).
  //
  // Read availability with `getAvailability`; configure it with these.

  getWeeklySchedule(doctorId?: string) {
    const query = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : "";
    return request<{ schedule: ScheduleBlock[] }>(`/schedules${query}`, { method: "GET" });
  },

  setWeeklySchedule(data: {
    blocks: { dayOfWeek: number; startTime: string; endTime: string }[];
    effectiveFrom?: string;
    doctorId?: string;
  }) {
    return request<{ schedule: ScheduleBlock[] }>("/schedules", {
      method: "PUT",
      body: data,
    });
  },

  getAvailability(params: { doctorId: string; consultationTypeId: string; date: string }) {
    const query = new URLSearchParams(params).toString();
    return request<AvailabilityDay>(`/availability?${query}`, { method: "GET" });
  },

  getBlockedTime(doctorId?: string) {
    const query = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : "";
    return request<{ blockedTime: BlockedTime[] }>(`/schedules/blocked-time${query}`, {
      method: "GET",
    });
  },

  createBlockedTime(data: {
    startAt: string;
    endAt: string;
    reason: BlockedTimeReason;
    note?: string;
    doctorId?: string;
  }) {
    return request<{ blockedTime: BlockedTime }>("/schedules/blocked-time", {
      method: "POST",
      body: data,
    });
  },

  deleteBlockedTime(id: string) {
    return request<{ message?: string }>(`/schedules/blocked-time/${id}`, { method: "DELETE" });
  },

  createException(data: {
    type: ExceptionType;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    reason?: string;
    doctorId?: string;
  }) {
    return request<{
      exception: ScheduleException;
      affectedAppointments: unknown[];
      message: string;
    }>("/schedules/exceptions", { method: "POST", body: data });
  },

  getExceptions(doctorId?: string) {
    const query = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : "";
    return request<{ exceptions: ScheduleException[] }>(`/schedules/exceptions${query}`, {
      method: "GET",
    });
  },

  deleteException(id: string) {
    return request<{ message?: string }>(`/schedules/exceptions/${id}`, { method: "DELETE" });
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