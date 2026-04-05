import type {
  Treatment,
  TreatmentCreate,
  TreatmentUpdate,
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  TimeSlot,
  TokenResponse,
  AdminUser,
  BusinessSettings,
  DashboardStats,
  ChartData,
  Customer,
  BlockedSlot,
  BlockedSlotCreate,
  NotificationsResponse,
} from "@/types";
import api from "./api";

// ── Treatments ──────────────────────────────────────────────────────────

export const treatmentService = {
  list: () => api.get<Treatment[]>("/treatments/").then((r) => r.data),

  getBySlug: (slug: string) =>
    api.get<Treatment>(`/treatments/${slug}`).then((r) => r.data),

  getCategories: () =>
    api.get<string[]>("/treatments/categories").then((r) => r.data),

  create: (data: TreatmentCreate) =>
    api.post<Treatment>("/treatments/", data).then((r) => r.data),

  update: (id: number, data: TreatmentUpdate) =>
    api.put<Treatment>(`/treatments/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/treatments/${id}`),

  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<Treatment>(`/treatments/${id}/upload-image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  uploadGallery: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return api
      .post<Treatment>(`/treatments/${id}/upload-gallery`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

// ── Appointments ────────────────────────────────────────────────────────

export const appointmentService = {
  getAvailableSlots: (treatmentId: number, date: string) =>
    api
      .get<TimeSlot[]>("/appointments/available-slots", {
        params: { treatment_id: treatmentId, date },
      })
      .then((r) => r.data),

  create: (data: AppointmentCreate) =>
    api.post<Appointment>("/appointments/", data).then((r) => r.data),

  list: (params?: {
    date_from?: string;
    date_to?: string;
    status?: string;
  }) => api.get<Appointment[]>("/appointments/", { params }).then((r) => r.data),

  get: (id: number) =>
    api.get<Appointment>(`/appointments/${id}`).then((r) => r.data),

  update: (id: number, data: AppointmentUpdate) =>
    api.put<Appointment>(`/appointments/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/appointments/${id}`),

  adminCreate: (data: AppointmentCreate) =>
    api.post<Appointment>("/appointments/admin-create", data).then((r) => r.data),
};

// ── Admin / Auth ────────────────────────────────────────────────────────

export const adminService = {
  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return api
      .post<TokenResponse>("/admin/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((r) => r.data);
  },

  me: () => api.get<AdminUser>("/admin/me").then((r) => r.data),

  getSettings: () =>
    api.get<BusinessSettings>("/admin/settings").then((r) => r.data),

  updateSettings: (data: Partial<BusinessSettings>) =>
    api.put<BusinessSettings>("/admin/settings", data).then((r) => r.data),

  getDashboardStats: () =>
    api.get<DashboardStats>("/admin/dashboard-stats").then((r) => r.data),

  getChartData: (days = 30) =>
    api.get<ChartData>("/admin/chart-data", { params: { days } }).then((r) => r.data),

  getCustomers: () =>
    api.get<Customer[]>("/admin/customers").then((r) => r.data),

  getBlockedSlots: (params?: { date_from?: string; date_to?: string }) =>
    api.get<BlockedSlot[]>("/admin/blocked-slots", { params }).then((r) => r.data),

  createBlockedSlot: (data: BlockedSlotCreate) =>
    api.post<BlockedSlot>("/admin/blocked-slots", data).then((r) => r.data),

  deleteBlockedSlot: (id: number) =>
    api.delete(`/admin/blocked-slots/${id}`),

  getNotifications: (unreadOnly = false) =>
    api.get<NotificationsResponse>("/admin/notifications", { params: { unread_only: unreadOnly } }).then((r) => r.data),

  markNotificationRead: (id: number) =>
    api.put(`/admin/notifications/${id}/read`).then((r) => r.data),

  markAllNotificationsRead: () =>
    api.put("/admin/notifications/read-all").then((r) => r.data),
};

// ── Treatment Reorder ──────────────────────────────────────────────────

export const treatmentReorderService = {
  reorder: (items: { id: number; sort_order: number }[]) =>
    api.put("/treatments/reorder", items).then((r) => r.data),
};
