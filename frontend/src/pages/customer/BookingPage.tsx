import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { treatmentService, appointmentService } from "@/lib/services";
import { formatPrice, formatDuration } from "@/lib/utils";
import type { Treatment, TimeSlot } from "@/types";

// ── Constants ───────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;
const DAYS_AHEAD = 30;

// ── Animation ───────────────────────────────────────────────────────────

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

// ── Progress bar ────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const s = i + 1;
        const active = s === step;
        const done = s < step;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300
                ${done ? "bg-primary-500 text-white" : active ? "bg-primary-500 text-white ring-4 ring-primary-100" : "bg-gray-100 text-gray-400"}`}
            >
              {done ? <HiOutlineCheck className="w-4 h-4" /> : s}
            </div>
            {s < TOTAL_STEPS && (
              <div
                className={`hidden sm:block w-10 h-0.5 rounded-full transition-colors duration-300
                  ${s < step ? "bg-primary-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Booking Page ────────────────────────────────────────────────────────

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const stepLabels = [t("booking.steps.date"), t("booking.steps.time"), t("booking.steps.details"), t("booking.steps.confirm")];

  // Data
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Selections
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Date grid pagination
  const [datePageStart, setDatePageStart] = useState(0);
  const datesPerPage = 14;

  // ── Load treatment ──────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    treatmentService
      .getBySlug(slug)
      .then(setTreatment)
      .catch(() => {
        toast.error(t("booking.treatmentNotFound"));
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [slug, navigate, t]);

  // ── Load slots when date changes ──────────────────────────────────

  useEffect(() => {
    if (!treatment || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime("");
    appointmentService
      .getAvailableSlots(treatment.id, selectedDate)
      .then(setSlots)
      .catch(() => toast.error(t("booking.loadTimesError")))
      .finally(() => setSlotsLoading(false));
  }, [treatment, selectedDate, t]);

  // ── Navigation helpers ────────────────────────────────────────────

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  // ── Submit booking ────────────────────────────────────────────────

  async function handleSubmit() {
    if (!treatment) return;
    setSubmitting(true);
    try {
      const appointment = await appointmentService.create({
        treatment_id: treatment.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        appointment_date: `${selectedDate}T${selectedTime}:00`,
        notes: notes.trim() || undefined,
      });
      navigate("/booking-confirmed", {
        state: { appointment, treatment },
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t("booking.bookingFailed");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Generate dates ────────────────────────────────────────────────

  const today = startOfDay(new Date());
  const allDates = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = addDays(today, i);
    return {
      dateStr: format(d, "yyyy-MM-dd"),
      day: format(d, "EEE"),
      dayNum: format(d, "d"),
      month: format(d, "MMM"),
      past: isBefore(d, today),
    };
  });
  const visibleDates = allDates.slice(datePageStart, datePageStart + datesPerPage);
  const canPageBack = datePageStart > 0;
  const canPageForward = datePageStart + datesPerPage < allDates.length;

  // ── Loading state ─────────────────────────────────────────────────

  if (loading || !treatment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {step === 1 ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <button
              onClick={goBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">
              {t("booking.title", { name: treatment.name })}
            </h1>
            <p className="text-sm text-gray-500">
              {formatDuration(treatment.duration_minutes)} &middot;{" "}
              {formatPrice(treatment.price)}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* Step label */}
        <p className="text-center text-sm font-medium text-gray-500 mb-6">
          {t("booking.step", { step, label: stepLabels[step - 1] })}
        </p>

        {/* Steps */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* ── Step 1: Date ──────────────────────────────────────── */}
              {step === 1 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <HiOutlineCalendar className="w-5 h-5 text-primary-500" />
                      {t("booking.selectDate")}
                    </h2>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDatePageStart((s) => Math.max(0, s - datesPerPage))}
                        disabled={!canPageBack}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                      >
                        <HiOutlineChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDatePageStart((s) => Math.min(allDates.length - datesPerPage, s + datesPerPage))}
                        disabled={!canPageForward}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                      >
                        <HiOutlineChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {visibleDates.map((d) => {
                      const isSelected = selectedDate === d.dateStr;
                      return (
                        <button
                          key={d.dateStr}
                          disabled={d.past}
                          onClick={() => setSelectedDate(d.dateStr)}
                          className={`flex flex-col items-center py-3 px-1 rounded-xl text-sm transition-all duration-200
                            ${
                              d.past
                                ? "opacity-30 cursor-not-allowed"
                                : isSelected
                                  ? "bg-primary-500 text-white shadow-md shadow-primary-200/50"
                                  : "bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                            }`}
                        >
                          <span className="text-[10px] font-medium uppercase">{d.day}</span>
                          <span className="text-lg font-bold leading-tight">{d.dayNum}</span>
                          <span className="text-[10px]">{d.month}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goNext}
                    disabled={!selectedDate}
                    className="mt-8 w-full py-3 rounded-xl bg-primary-500 text-white font-medium
                               disabled:opacity-40 disabled:cursor-not-allowed
                               hover:bg-primary-600 active:scale-[0.98] transition-all duration-200"
                  >
                    {t("booking.continue")}
                  </button>
                </div>
              )}

              {/* ── Step 2: Time ──────────────────────────────────────── */}
              {step === 2 && (
                <div>
                  <h2 className="font-display text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <HiOutlineClock className="w-5 h-5 text-primary-500" />
                    {t("booking.selectTime")}
                  </h2>

                  {selectedDate && (
                    <p className="text-sm text-gray-500 mb-4">
                      {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                    </p>
                  )}

                  {slotsLoading ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-11 rounded-lg skeleton" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <HiOutlineClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">{t("booking.noSlots")}</p>
                      <p className="text-sm mt-1">{t("booking.noSlotsHint")}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {slots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                              ${
                                !slot.available
                                  ? "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                                  : isSelected
                                    ? "bg-primary-500 text-white shadow-md shadow-primary-200/50"
                                    : "bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50"
                              }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={goNext}
                    disabled={!selectedTime}
                    className="mt-8 w-full py-3 rounded-xl bg-primary-500 text-white font-medium
                               disabled:opacity-40 disabled:cursor-not-allowed
                               hover:bg-primary-600 active:scale-[0.98] transition-all duration-200"
                  >
                    {t("booking.continue")}
                  </button>
                </div>
              )}

              {/* ── Step 3: Details ───────────────────────────────────── */}
              {step === 3 && (
                <div>
                  <h2 className="font-display text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                    <HiOutlineUser className="w-5 h-5 text-primary-500" />
                    {t("booking.yourDetails")}
                  </h2>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("booking.fullName")} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <HiOutlineUser className="absolute start-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder={t("booking.namePlaceholder")}
                          className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200
                                     focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                                     outline-none transition-all text-sm"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("booking.phoneNumber")} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <HiOutlinePhone className="absolute start-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder={t("booking.phonePlaceholder")}
                          className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200
                                     focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                                     outline-none transition-all text-sm"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("booking.email")} <span className="text-gray-400 font-normal">{t("booking.optional")}</span>
                      </label>
                      <div className="relative">
                        <HiOutlineMail className="absolute start-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder={t("booking.emailPlaceholder")}
                          className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200
                                     focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                                     outline-none transition-all text-sm"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("booking.notes")} <span className="text-gray-400 font-normal">{t("booking.optional")}</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("booking.notesPlaceholder")}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200
                                   focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                                   outline-none transition-all text-sm resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={goNext}
                    disabled={!customerName.trim() || !customerPhone.trim()}
                    className="mt-8 w-full py-3 rounded-xl bg-primary-500 text-white font-medium
                               disabled:opacity-40 disabled:cursor-not-allowed
                               hover:bg-primary-600 active:scale-[0.98] transition-all duration-200"
                  >
                    {t("booking.reviewBooking")}
                  </button>
                </div>
              )}

              {/* ── Step 4: Confirm ──────────────────────────────────── */}
              {step === 4 && (
                <div>
                  <h2 className="font-display text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                    <HiOutlineCheck className="w-5 h-5 text-primary-500" />
                    {t("booking.confirmTitle")}
                  </h2>

                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                    {/* Treatment */}
                    <div className="px-5 py-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("booking.treatmentLabel")}</p>
                      <p className="font-semibold text-gray-900">{treatment.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatDuration(treatment.duration_minutes)} &middot;{" "}
                        {formatPrice(treatment.price)}
                      </p>
                    </div>

                    {/* Date & time */}
                    <div className="px-5 py-4 flex gap-8">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("booking.dateLabel")}</p>
                        <p className="font-medium text-gray-900">
                          {selectedDate &&
                            format(new Date(selectedDate + "T00:00:00"), "EEEE, MMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("booking.timeLabel")}</p>
                        <p className="font-medium text-gray-900">{selectedTime}</p>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="px-5 py-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("booking.yourInfo")}</p>
                      <p className="font-medium text-gray-900">{customerName}</p>
                      <p className="text-sm text-gray-500">{customerPhone}</p>
                      {customerEmail && (
                        <p className="text-sm text-gray-500">{customerEmail}</p>
                      )}
                    </div>

                    {/* Notes */}
                    {notes.trim() && (
                      <div className="px-5 py-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("booking.notesLabel")}</p>
                        <p className="text-sm text-gray-600">{notes}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="mt-8 w-full py-3.5 rounded-xl bg-primary-500 text-white font-semibold
                               flex items-center justify-center gap-2
                               disabled:opacity-60 disabled:cursor-not-allowed
                               hover:bg-primary-600 active:scale-[0.98] transition-all duration-200
                               shadow-lg shadow-primary-300/30"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {t("booking.bookingInProgress")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t("booking.confirmBooking")}
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
