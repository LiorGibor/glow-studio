import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { format, parseISO, isToday } from "date-fns";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineColorSwatch,
  HiOutlineCurrencyDollar,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineBadgeCheck,
} from "react-icons/hi";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { adminService, appointmentService } from "@/lib/services";
import { formatPrice } from "@/lib/utils";
import type { DashboardStats, Appointment, ChartData } from "@/types";
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

function buildStats(
  stats: DashboardStats,
  t: (key: string, opts?: Record<string, unknown>) => string
): StatCard[] {
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
      sub: t("dashboardPage.todayRevenue", {
        amount: formatPrice(stats.revenue_today),
      }),
      icon: <HiOutlineCurrencyDollar className="w-6 h-6" />,
      gradient: "from-emerald-400 to-teal-600",
    },
  ];
}

// ── Quick-action button ─────────────────────────────────────────────────

function QuickActionButton({
  label,
  icon,
  color,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
      title={label}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { t } = useTranslation();

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminService.getDashboardStats(),
      adminService.getChartData(30),
    ])
      .then(([statsData, chart]) => {
        setStats(statsData);
        setChartData(chart);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (
    id: number,
    newStatus: "confirmed" | "cancelled" | "completed"
  ) => {
    setUpdatingId(id);
    try {
      await appointmentService.update(id, { status: newStatus });
      toast.success(t("dashboardPage.statusUpdated"));
      fetchData();
    } catch {
      toast.error(t("dashboardPage.statusUpdateError"));
    } finally {
      setUpdatingId(null);
    }
  };

  const cards = stats ? buildStats(stats, t) : [];

  // Today's appointments sorted by time
  const todayAppointments = stats
    ? stats.recent_appointments
        .filter((appt) => {
          try {
            return isToday(parseISO(appt.appointment_date));
          } catch {
            return false;
          }
        })
        .sort(
          (a, b) =>
            new Date(a.appointment_date).getTime() -
            new Date(b.appointment_date).getTime()
        )
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("dashboardPage.title")}
        </h1>
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

      {/* Today's Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("dashboardPage.todaySchedule")}
          </h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-16 rounded skeleton" />
                  <div className="h-4 w-32 rounded skeleton" />
                  <div className="h-4 w-24 rounded skeleton" />
                  <div className="h-5 w-20 rounded-full skeleton" />
                </div>
              ))}
            </div>
          ) : todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50/50 transition-colors"
                >
                  <span className="text-sm font-mono font-medium text-primary-600 min-w-[60px]">
                    {format(parseISO(appt.appointment_date), "HH:mm")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 flex-1">
                    {appt.customer_name}
                  </span>
                  <span className="text-sm text-gray-500 flex-1">
                    {appt.treatment?.name ||
                      `Treatment #${appt.treatment_id}`}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-6">
              {t("dashboardPage.noToday")}
            </p>
          )}
        </div>
      </motion.div>

      {/* Charts */}
      {!loading && chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Revenue bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {t("dashboardPage.revenueChart")}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v: string) => {
                      try {
                        return format(parseISO(v), "MM/dd");
                      } catch {
                        return v;
                      }
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f3f4f6",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                    labelFormatter={(v) => {
                      try {
                        return format(parseISO(v), "MMM d, yyyy");
                      } catch {
                        return v;
                      }
                    }}
                    formatter={(value) => [
                      formatPrice(Number(value ?? 0)),
                      t("dashboardPage.revenue"),
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#ec4899"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bookings line chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.45 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {t("dashboardPage.bookingsChart")}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v: string) => {
                      try {
                        return format(parseISO(v), "MM/dd");
                      } catch {
                        return v;
                      }
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f3f4f6",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                    labelFormatter={(v) => {
                      try {
                        return format(parseISO(v), "MMM d, yyyy");
                      } catch {
                        return v;
                      }
                    }}
                    formatter={(value) => [
                      value,
                      t("dashboardPage.bookings"),
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#ec4899" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top treatments horizontal bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.45 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2"
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {t("dashboardPage.topTreatments")}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.top_treatments}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f3f4f6",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                    formatter={(value) => [
                      value,
                      t("dashboardPage.bookings"),
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#ec4899"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recent appointments with quick actions */}
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
              <tr className="text-start text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium text-start">
                  {t("dashboardPage.customer")}
                </th>
                <th className="px-6 py-3 font-medium text-start">
                  {t("dashboardPage.treatment")}
                </th>
                <th className="px-6 py-3 font-medium text-start">
                  {t("dashboardPage.dateTime")}
                </th>
                <th className="px-6 py-3 font-medium text-start">
                  {t("dashboardPage.status")}
                </th>
                <th className="px-6 py-3 font-medium text-start">
                  {t("dashboardPage.actions")}
                </th>
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
                      {appt.treatment?.name ||
                        `Treatment #${appt.treatment_id}`}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(
                        parseISO(appt.appointment_date),
                        "MMM d, yyyy · h:mm a"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {appt.status === "pending" && (
                          <QuickActionButton
                            label={t("dashboardPage.confirm")}
                            icon={<HiOutlineCheck className="w-3.5 h-3.5" />}
                            color="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            onClick={() =>
                              handleStatusChange(appt.id, "confirmed")
                            }
                            disabled={updatingId === appt.id}
                          />
                        )}
                        {(appt.status === "pending" ||
                          appt.status === "confirmed") && (
                          <>
                            <QuickActionButton
                              label={t("dashboardPage.complete")}
                              icon={
                                <HiOutlineBadgeCheck className="w-3.5 h-3.5" />
                              }
                              color="bg-blue-50 text-blue-700 hover:bg-blue-100"
                              onClick={() =>
                                handleStatusChange(appt.id, "completed")
                              }
                              disabled={updatingId === appt.id}
                            />
                            <QuickActionButton
                              label={t("dashboardPage.cancel")}
                              icon={<HiOutlineX className="w-3.5 h-3.5" />}
                              color="bg-red-50 text-red-700 hover:bg-red-100"
                              onClick={() =>
                                handleStatusChange(appt.id, "cancelled")
                              }
                              disabled={updatingId === appt.id}
                            />
                          </>
                        )}
                        {(appt.status === "completed" ||
                          appt.status === "cancelled" ||
                          appt.status === "no_show") && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
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
