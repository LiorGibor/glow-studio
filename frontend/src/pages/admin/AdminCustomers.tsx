import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  HiOutlineSearch,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { adminService } from "@/lib/services";
import { formatPrice } from "@/lib/utils";
import type { Customer, CustomerAppointment } from "@/types";

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

// ── Skeleton components ─────────────────────────────────────────────────

function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
      <div className="h-4 w-24 rounded skeleton" />
      <div className="h-8 w-20 rounded skeleton" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-6 py-4"><div className="h-4 w-28 rounded skeleton" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 rounded skeleton" /></td>
      <td className="px-6 py-4"><div className="h-4 w-36 rounded skeleton" /></td>
      <td className="px-6 py-4"><div className="h-4 w-12 rounded skeleton" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 rounded skeleton" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 rounded skeleton" /></td>
    </tr>
  );
}

// ── Component ───────────────────────────────────────────────────────────

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    adminService
      .getCustomers()
      .then(setCustomers)
      .catch(() => toast.error(t("customersPage.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  // Sort by total_bookings descending
  const sorted = [...customers].sort(
    (a, b) => b.total_bookings - a.total_bookings
  );

  // Filter by search (name or phone)
  const filtered = sorted.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_phone.includes(search)
  );

  // Summary stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);

  const toggleExpand = (phone: string) => {
    setExpandedPhone((prev) => (prev === phone ? null : phone));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("customersPage.title")}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("customersPage.subtitle")}
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <motion.div
              custom={0}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  {t("customersPage.totalCustomers")}
                </span>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center">
                  <HiOutlineUserGroup className="w-6 h-6" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {totalCustomers}
              </span>
            </motion.div>

            <motion.div
              custom={1}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  {t("customersPage.totalRevenue")}
                </span>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center">
                  <HiOutlineCurrencyDollar className="w-6 h-6" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(totalRevenue)}
              </span>
            </motion.div>
          </>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <HiOutlineSearch className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t("customersPage.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
        />
      </div>

      {/* Customer table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3 font-medium text-start">{t("customersPage.name")}</th>
                <th className="px-6 py-3 font-medium text-start">{t("customersPage.phone")}</th>
                <th className="px-6 py-3 font-medium text-start">{t("customersPage.email")}</th>
                <th className="px-6 py-3 font-medium text-start">{t("customersPage.totalBookings")}</th>
                <th className="px-6 py-3 font-medium text-start">{t("customersPage.totalSpent")}</th>
                <th className="px-6 py-3 font-medium text-start">{t("customersPage.lastVisit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-gray-400"
                  >
                    {t("customersPage.noCustomers")}
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => {
                  const isExpanded = expandedPhone === customer.customer_phone;
                  return (
                    <AnimatePresence key={customer.customer_phone}>
                      <tr
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(customer.customer_phone)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {customer.customer_name}
                            </span>
                            {isExpanded ? (
                              <HiOutlineChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <HiOutlineChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {customer.customer_phone}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {customer.customer_email || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {customer.total_bookings}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {formatPrice(customer.total_spent)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {customer.last_visit
                            ? format(parseISO(customer.last_visit), "MMM d, yyyy")
                            : "-"}
                        </td>
                      </tr>

                      {/* Expanded booking history */}
                      {isExpanded && (
                        <motion.tr
                          key={`${customer.customer_phone}-details`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td colSpan={6} className="px-6 py-4 bg-gray-50/50">
                            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700">
                                  {t("customersPage.bookingHistory")}
                                </h3>
                              </div>
                              {customer.appointments.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                  {t("customersPage.noBookings")}
                                </div>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-start text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                      <th className="px-4 py-2.5 font-medium text-start">
                                        {t("customersPage.treatmentName")}
                                      </th>
                                      <th className="px-4 py-2.5 font-medium text-start">
                                        {t("customersPage.date")}
                                      </th>
                                      <th className="px-4 py-2.5 font-medium text-start">
                                        {t("customersPage.status")}
                                      </th>
                                      <th className="px-4 py-2.5 font-medium text-start">
                                        {t("customersPage.price")}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {customer.appointments.map(
                                      (appt: CustomerAppointment) => (
                                        <tr
                                          key={appt.id}
                                          className="hover:bg-gray-50/50 transition-colors"
                                        >
                                          <td className="px-4 py-3 text-gray-900">
                                            {appt.treatment_name}
                                          </td>
                                          <td className="px-4 py-3 text-gray-600">
                                            {format(
                                              parseISO(appt.appointment_date),
                                              "MMM d, yyyy"
                                            )}
                                          </td>
                                          <td className="px-4 py-3">
                                            <StatusBadge status={appt.status} />
                                          </td>
                                          <td className="px-4 py-3 text-gray-900 font-medium">
                                            {formatPrice(appt.price)}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
