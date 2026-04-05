import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineClock,
  HiOutlineOfficeBuilding,
  HiOutlineSave,
  HiOutlineCog,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { adminService } from "@/lib/services";
import type { BusinessSettings, DaySchedule, BreakTime } from "@/types";

// ── Day keys ───────────────────────────────────────────────────────────

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DEFAULT_SCHEDULE: DaySchedule = {
  open: "09:00",
  close: "18:00",
  is_open: true,
};

// ── Component ───────────────────────────────────────────────────────────

export default function AdminSettings() {
  const { t } = useTranslation();
  const [, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local form state
  const [workingHours, setWorkingHours] = useState<Record<string, DaySchedule>>(
    {}
  );
  const [breakTimes, setBreakTimes] = useState<BreakTime[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [bookingAdvanceDays, setBookingAdvanceDays] = useState(30);
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // Load settings on mount
  useEffect(() => {
    adminService
      .getSettings()
      .then((data) => {
        setSettings(data);
        setWorkingHours(data.working_hours || {});
        setBreakTimes(data.break_times || []);
        setSlotDuration(data.slot_duration || 30);
        setBookingAdvanceDays(data.booking_advance_days || 30);
        setBusinessName(data.business_name || "");
        setBusinessPhone(data.business_phone || "");
        setBusinessAddress(data.business_address || "");
      })
      .catch(() => toast.error(t("settingsPage.loadError")))
      .finally(() => setLoading(false));
  }, []);

  // Update a day's schedule
  const updateDay = (
    dayKey: string,
    field: keyof DaySchedule,
    value: string | boolean
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...(prev[dayKey] || DEFAULT_SCHEDULE),
        [field]: value,
      },
    }));
  };

  // Break time management
  const addBreak = () => {
    setBreakTimes((prev) => [...prev, { start: "13:00", end: "14:00" }]);
  };

  const updateBreak = (index: number, field: keyof BreakTime, value: string) => {
    setBreakTimes((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  };

  const removeBreak = (index: number) => {
    setBreakTimes((prev) => prev.filter((_, i) => i !== index));
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await adminService.updateSettings({
        working_hours: workingHours,
        break_times: breakTimes,
        slot_duration: slotDuration,
        booking_advance_days: bookingAdvanceDays,
        business_name: businessName,
        business_phone: businessPhone,
        business_address: businessAddress,
      });
      setSettings(updated);
      toast.success(t("settingsPage.saved"));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t("settingsPage.saveError");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("settingsPage.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("settingsPage.loading")}</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="h-6 w-40 rounded skeleton mb-4" />
              <div className="h-4 w-full rounded skeleton mb-2" />
              <div className="h-4 w-3/4 rounded skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("settingsPage.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("settingsPage.subtitle")}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm shadow-sm hover:shadow-md transition disabled:opacity-50"
        >
          <HiOutlineSave className="w-5 h-5" />
          {saving ? t("settingsPage.saving") : t("settingsPage.saveChanges")}
        </button>
      </div>

      {/* ── Business Information ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center">
            <HiOutlineOfficeBuilding className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settingsPage.businessInfo")}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("settingsPage.businessName")}
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("settingsPage.phoneNumber")}
              </label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder={t("settingsPage.phonePlaceholder")}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("settingsPage.address")}
              </label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder={t("settingsPage.addressPlaceholder")}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Working Hours ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 text-white flex items-center justify-center">
            <HiOutlineClock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settingsPage.workingHours")}
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {DAYS.map((key) => {
              const schedule = workingHours[key] || DEFAULT_SCHEDULE;
              return (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  {/* Day name + toggle */}
                  <div className="flex items-center gap-3 sm:w-40">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schedule.is_open}
                        onChange={(e) =>
                          updateDay(key, "is_open", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                    <span
                      className={`text-sm font-medium ${
                        schedule.is_open ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {t("settingsPage.days." + key)}
                    </span>
                  </div>

                  {/* Time inputs */}
                  {schedule.is_open ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule.open}
                        onChange={(e) => updateDay(key, "open", e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      />
                      <span className="text-gray-400 text-sm">{t("settingsPage.to")}</span>
                      <input
                        type="time"
                        value={schedule.close}
                        onChange={(e) =>
                          updateDay(key, "close", e.target.value)
                        }
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">{t("settingsPage.closed")}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Break Times ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center">
              <HiOutlineClock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t("settingsPage.breakTimes")}
            </h2>
          </div>
          <button
            onClick={addBreak}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition"
          >
            {t("settingsPage.addBreak")}
          </button>
        </div>
        <div className="p-6">
          {breakTimes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {t("settingsPage.noBreaks")}
            </p>
          ) : (
            <div className="space-y-3">
              {breakTimes.map((bt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="time"
                    value={bt.start}
                    onChange={(e) => updateBreak(i, "start", e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                  <span className="text-gray-400 text-sm">{t("settingsPage.to")}</span>
                  <input
                    type="time"
                    value={bt.end}
                    onChange={(e) => updateBreak(i, "end", e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeBreak(i)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                  >
                    <span className="text-sm">{t("settingsPage.remove")}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Booking Configuration ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center">
            <HiOutlineCog className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settingsPage.bookingConfig")}
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("settingsPage.slotDuration")}
              </label>
              <p className="text-xs text-gray-400 mb-2">
                {t("settingsPage.slotDurationHelp")}
              </p>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value={15}>{t("settingsPage.minutes15")}</option>
                <option value={30}>{t("settingsPage.minutes30")}</option>
                <option value={45}>{t("settingsPage.minutes45")}</option>
                <option value={60}>{t("settingsPage.minutes60")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("settingsPage.advanceBooking")}
              </label>
              <p className="text-xs text-gray-400 mb-2">
                {t("settingsPage.advanceBookingHelp")}
              </p>
              <input
                type="number"
                min={1}
                max={365}
                value={bookingAdvanceDays}
                onChange={(e) =>
                  setBookingAdvanceDays(parseInt(e.target.value) || 30)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom save button (mobile convenience) */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm shadow-sm hover:shadow-md transition disabled:opacity-50"
        >
          <HiOutlineSave className="w-5 h-5" />
          {saving ? t("settingsPage.saving") : t("settingsPage.saveAll")}
        </button>
      </div>
    </div>
  );
}
