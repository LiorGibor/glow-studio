import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { HiOutlineCheck, HiOutlineCalendar, HiOutlineClock } from "react-icons/hi";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPrice, formatDuration } from "@/lib/utils";
import type { Appointment, Treatment } from "@/types";

// ── Booking Confirmation ────────────────────────────────────────────────

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const state = location.state as
    | { appointment: Appointment; treatment: Treatment }
    | undefined;

  // Redirect if accessed directly without state
  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  const { appointment, treatment } = state;

  const appointmentDate = new Date(appointment.appointment_date);
  const dateDisplay = format(appointmentDate, "EEEE, MMMM d, yyyy");
  const timeDisplay = format(appointmentDate, "h:mm a");

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.35 }}
          >
            <HiOutlineCheck className="w-10 h-10 text-green-600" />
          </motion.div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-display text-3xl sm:text-4xl font-bold text-gray-900"
        >
          {t("confirmation.title")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-3 text-gray-500"
        >
          {t("confirmation.subtitle")}
        </motion.p>

        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden text-start"
        >
          {/* Treatment header */}
          <div className="px-6 py-5 bg-gradient-to-r from-primary-50 to-white">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">
                {t("confirmation.treatment")}
              </span>
            </div>
            <p className="font-display text-lg font-semibold text-gray-900">
              {treatment.name}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatDuration(treatment.duration_minutes)} &middot;{" "}
              {formatPrice(treatment.price)}
            </p>
          </div>

          {/* Details */}
          <div className="px-6 py-4 space-y-3 divide-y divide-gray-50">
            <div className="flex items-start gap-3 pt-3 first:pt-0">
              <HiOutlineCalendar className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{t("confirmation.date")}</p>
                <p className="font-medium text-gray-900">{dateDisplay}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3">
              <HiOutlineClock className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{t("confirmation.time")}</p>
                <p className="font-medium text-gray-900">{timeDisplay}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3">
              <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mt-0.5 shrink-0">
                <span className="text-xs font-bold text-primary-600">
                  {appointment.customer_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{t("confirmation.bookedBy")}</p>
                <p className="font-medium text-gray-900">{appointment.customer_name}</p>
                {appointment.customer_phone && (
                  <p className="text-sm text-gray-500">{appointment.customer_phone}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-full
                       bg-primary-500 text-white font-semibold
                       shadow-lg shadow-primary-300/30 hover:bg-primary-600
                       active:scale-[0.97] transition-all duration-200"
          >
            {t("confirmation.backHome")}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
