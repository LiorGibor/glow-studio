import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineViewGrid,
  HiOutlineCalendar,
  HiOutlineScissors,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { adminService } from "@/lib/services";
import type { AdminUser } from "@/types";
import LanguageToggle from "@/components/LanguageToggle";

export default function AdminLayout() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sidebarLinks = [
    { label: t("admin.dashboard"), to: "/admin", icon: HiOutlineViewGrid },
    { label: t("admin.calendar"), to: "/admin/calendar", icon: HiOutlineCalendar },
    { label: t("admin.treatments"), to: "/admin/treatments", icon: HiOutlineScissors },
    { label: t("admin.appointments"), to: "/admin/appointments", icon: HiOutlineClipboardList },
    { label: t("admin.settings"), to: "/admin/settings", icon: HiOutlineCog },
  ];

  useEffect(() => {
    const token = localStorage.getItem("glow_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    adminService
      .me()
      .then(setAdmin)
      .catch(() => navigate("/admin/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("glow_token");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 start-0 z-50 w-64 bg-white border-e border-gray-200 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <span className="font-display text-lg font-semibold text-gray-900">
              {t("admin.panel")}
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ms-auto lg:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <HiOutlineX size={20} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive =
                link.to === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all no-underline ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <link.icon size={20} />
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="admin-nav-indicator"
                      className="ms-auto w-1.5 h-1.5 rounded-full bg-primary-500"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {admin?.full_name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {admin?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <HiOutlineLogout size={18} />
              {t("admin.signOut")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ms-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HiOutlineMenu size={20} />
          </button>
          <div className="ms-2 lg:ms-0 flex items-center gap-3">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors no-underline"
            >
              {t("admin.viewSite")} &rarr;
            </Link>
            <LanguageToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
