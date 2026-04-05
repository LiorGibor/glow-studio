import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  getDay,
} from "date-fns";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
} from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { appointmentService } from "@/lib/services";
import type { Appointment } from "@/types";

// ── Status badge ────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-700",
  completed: "bg-blue-50 text-blue-700",
  no_show: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        statusColors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {t("statuses." + status)}
    </span>
  );
}

// ── Component ───────────────────────────────────────────────────────────

export default function AdminCalendar() {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const dayNames = t("calendarPage.days", { returnObjects: true }) as string[];

  // Fetch appointments for the visible range
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    // Extend range to fill the calendar grid (previous month days + next month days)
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - getDay(monthStart));
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(gridEnd.getDate() + (6 - getDay(monthEnd)));

    appointmentService
      .list({
        date_from: format(gridStart, "yyyy-MM-dd"),
        date_to: format(gridEnd, "yyyy-MM-dd"),
      })
      .then(setAppointments)
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  // Build calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - getDay(monthStart));
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - getDay(monthEnd)));

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Count appointments per day
  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    appointments.forEach((appt) => {
      const key = format(parseISO(appt.appointment_date), "yyyy-MM-dd");
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [appointments]);

  // Appointments for selected day
  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter((appt) => isSameDay(parseISO(appt.appointment_date), selectedDate))
      .sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime()
      );
  }, [selectedDate, appointments]);

  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("calendarPage.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("calendarPage.subtitle")}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <HiOutlineChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <HiOutlineChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((name) => (
            <div
              key={name}
              className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider py-2"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden">
          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = countByDay[key] || 0;
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`
                  relative min-h-[80px] sm:min-h-[96px] p-2 text-start transition bg-white hover:bg-gray-50
                  ${!isCurrentMonth ? "opacity-40" : ""}
                  ${isSelected ? "ring-2 ring-inset ring-primary-400" : ""}
                `}
              >
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                    ${isToday ? "bg-primary-500 text-white" : "text-gray-700"}
                  `}
                >
                  {format(day, "d")}
                </span>

                {count > 0 && (
                  <div className="mt-1">
                    <span
                      className={`
                        inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                        ${
                          count >= 3
                            ? "bg-primary-100 text-primary-700"
                            : "bg-gray-100 text-gray-600"
                        }
                      `}
                    >
                      {count > 1 ? t("calendarPage.appts", { count }) : t("calendarPage.appt", { count })}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="text-center py-6 text-gray-400 text-sm">
            {t("calendarPage.loading")}
          </div>
        )}
      </motion.div>

      {/* Selected day panel */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <HiOutlineX className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {selectedDayAppointments.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              {t("calendarPage.noAppointments")}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {selectedDayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6"
                >
                  <span className="text-sm font-medium text-primary-600 whitespace-nowrap">
                    {format(parseISO(appt.appointment_date), "h:mm a")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {appt.customer_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {appt.treatment?.name || `Treatment #${appt.treatment_id}`}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
