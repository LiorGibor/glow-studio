import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineFilter,
  HiOutlinePhone,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { appointmentService, treatmentService } from "@/lib/services";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentUpdate,
  Treatment,
} from "@/types";

// ── Status config ───────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-700",
  completed: "bg-blue-50 text-blue-700",
  no_show: "bg-gray-100 text-gray-600",
};

const ALL_STATUSES: AppointmentStatus[] = [
  "confirmed",
  "pending",
  "cancelled",
  "completed",
  "no_show",
];

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

// ── Component ───────────────────────────────────────────────────────────

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState<AppointmentUpdate>({});
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  // Fetch data
  const fetchAppointments = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter !== "all") params.status = statusFilter;

    appointmentService
      .list(params)
      .then(setAppointments)
      .catch(() => toast.error(t("appointmentsAdmin.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    treatmentService.list().then(setTreatments).catch(() => {});
  }, []);

  // Filtered by search
  const filtered = appointments.filter(
    (a) =>
      a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      a.customer_phone.includes(search) ||
      (a.treatment?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Open edit modal
  const openEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setEditForm({
      customer_name: appt.customer_name,
      customer_phone: appt.customer_phone,
      customer_email: appt.customer_email || "",
      status: appt.status,
      notes: appt.notes || "",
      admin_notes: appt.admin_notes || "",
    });
  };

  // Save edit
  const handleSave = async () => {
    if (!editingAppt) return;
    setSaving(true);
    try {
      await appointmentService.update(editingAppt.id, editForm);
      toast.success(t("appointmentsAdmin.updated"));
      setEditingAppt(null);
      fetchAppointments();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t("appointmentsAdmin.updateError");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Quick status change
  const changeStatus = async (appt: Appointment, newStatus: AppointmentStatus) => {
    try {
      await appointmentService.update(appt.id, { status: newStatus });
      toast.success(t("appointmentsAdmin.statusChanged", { status: newStatus }));
      fetchAppointments();
    } catch {
      toast.error(t("appointmentsAdmin.statusError"));
    }
  };

  // Delete
  const handleDelete = async (appt: Appointment) => {
    if (
      !confirm(
        t("appointmentsAdmin.deleteConfirm", { name: appt.customer_name })
      )
    )
      return;

    try {
      await appointmentService.delete(appt.id);
      toast.success(t("appointmentsAdmin.deleted"));
      fetchAppointments();
    } catch {
      toast.error(t("appointmentsAdmin.deleteError"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("appointmentsAdmin.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("appointmentsAdmin.subtitle")}
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("appointmentsAdmin.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <HiOutlineFilter className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ps-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition appearance-none cursor-pointer"
          >
            <option value="all">{t("appointmentsAdmin.allStatuses")}</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t("statuses." + s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3 font-medium">{t("appointmentsAdmin.customer")}</th>
                <th className="px-6 py-3 font-medium">{t("appointmentsAdmin.treatment")}</th>
                <th className="px-6 py-3 font-medium">{t("appointmentsAdmin.dateTime")}</th>
                <th className="px-6 py-3 font-medium">{t("appointmentsAdmin.status")}</th>
                <th className="px-6 py-3 font-medium text-end">{t("appointmentsAdmin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 w-28 rounded skeleton" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded skeleton" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 rounded skeleton" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-20 rounded-full skeleton" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 rounded skeleton ms-auto" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-gray-400"
                  >
                    {t("appointmentsAdmin.noAppointments")}
                  </td>
                </tr>
              ) : (
                filtered.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {appt.customer_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <HiOutlinePhone className="w-3 h-3" />
                          {appt.customer_phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {appt.treatment?.name ||
                        `Treatment #${appt.treatment_id}`}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(
                        parseISO(appt.appointment_date),
                        "MMM d, yyyy"
                      )}
                      <span className="text-gray-400 ms-1">
                        {format(parseISO(appt.appointment_date), "h:mm a")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick status actions */}
                        {appt.status === "confirmed" && (
                          <button
                            onClick={() => changeStatus(appt, "completed")}
                            className="px-2 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                            title="Mark completed"
                          >
                            {t("appointmentsAdmin.complete")}
                          </button>
                        )}
                        {(appt.status === "confirmed" ||
                          appt.status === "pending") && (
                          <button
                            onClick={() => changeStatus(appt, "cancelled")}
                            className="px-2 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition"
                            title="Cancel"
                          >
                            {t("appointmentsAdmin.cancel")}
                          </button>
                        )}

                        <button
                          onClick={() => openEdit(appt)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(appt)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Edit Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingAppt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setEditingAppt(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg mb-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("appointmentsAdmin.editTitle")}
                </h2>
                <button
                  onClick={() => setEditingAppt(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <HiOutlineX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Info banner */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t("appointmentsAdmin.treatmentInfo")}</span>{" "}
                  {editingAppt.treatment?.name || `#${editingAppt.treatment_id}`}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t("appointmentsAdmin.bookedFor")}</span>{" "}
                  {format(
                    parseISO(editingAppt.appointment_date),
                    "EEEE, MMM d, yyyy 'at' h:mm a"
                  )}
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4 max-h-[50vh] overflow-y-auto">
                {/* Customer name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("appointmentsAdmin.customerName")}
                  </label>
                  <input
                    type="text"
                    value={editForm.customer_name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, customer_name: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("appointmentsAdmin.phone")}
                    </label>
                    <input
                      type="text"
                      value={editForm.customer_phone || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          customer_phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("appointmentsAdmin.email")}
                    </label>
                    <input
                      type="email"
                      value={editForm.customer_email || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          customer_email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("appointmentsAdmin.statusLabel")}
                  </label>
                  <select
                    value={editForm.status || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as AppointmentStatus,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent appearance-none cursor-pointer"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t("statuses." + s)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("appointmentsAdmin.customerNotes")}
                  </label>
                  <textarea
                    value={editForm.notes || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* Admin notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("appointmentsAdmin.adminNotes")}
                  </label>
                  <textarea
                    value={editForm.admin_notes || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, admin_notes: e.target.value })
                    }
                    rows={2}
                    placeholder={t("appointmentsAdmin.adminNotesPlaceholder")}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setEditingAppt(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  {t("appointmentsAdmin.cancelBtn")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition disabled:opacity-50"
                >
                  {saving ? t("appointmentsAdmin.savingBtn") : t("appointmentsAdmin.saveChanges")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
