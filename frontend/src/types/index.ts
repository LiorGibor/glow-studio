// ── Treatment ────────────────────────────────────────────────────────────

export interface Treatment {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  short_description: string | null;
  duration_minutes: number;
  price: number;
  image_url: string | null;
  gallery_urls: string | null; // JSON array
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface TreatmentCreate {
  name: string;
  category: string;
  description?: string;
  short_description?: string;
  duration_minutes: number;
  price: number;
  is_active?: boolean;
  sort_order?: number;
}

export type TreatmentUpdate = Partial<TreatmentCreate>;

// ── Appointment ─────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Appointment {
  id: number;
  treatment_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  appointment_date: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
  treatment?: Treatment;
}

export interface AppointmentCreate {
  treatment_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  appointment_date: string;
  notes?: string;
}

export interface AppointmentUpdate {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  appointment_date?: string;
  status?: AppointmentStatus;
  notes?: string;
  admin_notes?: string;
}

// ── Time Slot ───────────────────────────────────────────────────────────

export interface TimeSlot {
  time: string; // "HH:MM"
  available: boolean;
}

// ── Admin / Auth ────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ── Business Settings ───────────────────────────────────────────────────

export interface DaySchedule {
  open: string;
  close: string;
  is_open: boolean;
}

export interface BreakTime {
  start: string;
  end: string;
}

export interface BusinessSettings {
  working_hours: Record<string, DaySchedule>;
  break_times: BreakTime[];
  slot_duration: number;
  booking_advance_days: number;
  business_name: string;
  business_phone: string;
  business_address: string;
}

// ── Dashboard ───────────────────────────────────────────────────────────

export interface DashboardStats {
  total_appointments: number;
  today_appointments: number;
  upcoming_appointments: number;
  total_treatments: number;
  revenue_today: number;
  revenue_month: number;
  recent_appointments: Appointment[];
}
