import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineBell, HiCheck } from "react-icons/hi";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { adminService } from "@/lib/services";
import type { AppNotification } from "@/types";

const POLL_INTERVAL = 30_000;
const MAX_NOTIFICATIONS = 50;

function notificationIcon(type: string) {
  switch (type) {
    case "new_booking":
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 011 1v3a1 1 0 01-2 0V8a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      );
    case "cancellation":
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      );
    case "completed":
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <HiCheck className="h-4 w-4" />
        </span>
      );
    default:
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
          <HiOutlineBell className="h-4 w-4" />
        </span>
      );
  }
}

export default function NotificationCenter() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await adminService.getNotifications();
      setNotifications(data.notifications.slice(0, MAX_NOTIFICATIONS));
      setUnreadCount(data.unread_count);
    } catch {
      // silently ignore – user may have logged out
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleMarkRead = async (id: number) => {
    try {
      await adminService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: i18n.language === "he" ? he : undefined,
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        aria-label={t("notifications.title")}
      >
        <HiOutlineBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 end-0 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white shadow-lg ring-1 ring-black/5 z-50">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 rounded-t-2xl">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("notifications.title")}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-pink-600 hover:text-pink-700 transition-colors cursor-pointer"
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {t("notifications.empty")}
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`flex gap-3 px-4 py-3 transition-colors ${
                    !n.is_read
                      ? "cursor-pointer bg-pink-50/40 hover:bg-pink-50/70 border-s-2 border-pink-400"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {notificationIcon(n.type)}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm truncate ${
                        !n.is_read ? "font-bold text-gray-900" : "font-medium text-gray-700"
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                        {n.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-gray-400">
                      {formatTime(n.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
