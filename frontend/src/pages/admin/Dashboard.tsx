import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineColorSwatch,
  HiOutlineCurrencyDollar,
} from "react-icons/hi";
import { adminService } from "@/lib/services";
import { formatPrice } from "@/lib/utils";
import type { DashboardStats, Appointment } from "@/types";
import { useTranslation } from "react-i18next";

// ── Animation helpers ───────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: "easeOut" as const },
  }),
};

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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        statusColors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {t("statuses." + status)}
    </span>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
      <div className="h-4 w-24 rounded skeleton" />
      <div className="h-8 w-20 rounded skeleton" />
      <div className="h-3 w-32 rounded skeleton" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="h-4 w-28 rounded skeleton" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 rounded skeleton" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-32 rounded skeleton" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 rounded-full skeleton" />
      </td>
    </tr>
  );
}

// ── Stat card data ──────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
}

function buildStats(stats: DashboardStats, t: (key: string, opts?: Record<string, unknown>) => string): StatCard[] {
  return [
    {
      label: t("dashboardPage.todayAppointments"),
      value: stats.today_appointments,
      icon: <HiOutlineCalendar className="w-6 h-6" />,
      gradient: "from-primary-400 to-primary-600",
    },
    {
      label: t("dashboardPage.upcoming"),
      value: stats.upcoming_appointments,
      icon: <HiOutlineClock className="w-6 h-6" />,
      gradient: "from-violet-400 to-purple-600",
    },
    {
      label: t("dashboardPage.totalTreatments"),
      value: stats.total_treatments,
      icon: <HiOutlineColorSwatch className="w-6 h-6" />,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      label: t("dashboardPage.monthlyRevenue"),
      value: formatPrice(stats.revenue_month),
      sub: t("dashboardPage.todayRevenue", { amount: formatPrice(stats.revenue_today) }),
      icon: <HiOutlineCurrencyDollar className="w-6 h-6" />,
      gradient: "from-emerald-400 to-teal-600",
    },
  ];
}

// ── Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    adminService
      .getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? buildStats(stats, t) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboardPage.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("dashboardPage.subtitle")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : cards.map((card, i) => (
              <motion.div
                key={card.label}
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    {card.label}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center`}
                  >
                    {card.icon}
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {card.value}
                </span>
                {card.sub && (
                  <span className="text-xs text-gray-400">{card.sub}</span>
                )}
              </motion.div>
            ))}
      </div>

      {/* Recent appointments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("dashboardPage.recentAppointments")}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">{t("dashboardPage.customer")}</th>
                <th className="px-6 py-3 font-medium">{t("dashboardPage.treatment")}</th>
                <th className="px-6 py-3 font-medium">{t("dashboardPage.dateTime")}</th>
                <th className="px-6 py-3 font-medium">{t("dashboardPage.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : stats && stats.recent_appointments.length > 0 ? (
                stats.recent_appointments.map((appt: Appointment) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {appt.customer_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {appt.treatment?.name || `Treatment #${appt.treatment_id}`}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(parseISO(appt.appointment_date), "MMM d, yyyy · h:mm a")}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    {t("dashboardPage.noRecent")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
