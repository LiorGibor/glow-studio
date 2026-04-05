import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <span className="font-display text-lg font-semibold text-white">
                {t("brand.name")}
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {t("brand.tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors no-underline text-gray-400">
                  {t("footer.home")}
                </Link>
              </li>
              <li>
                <Link to="/#treatments" className="text-sm hover:text-white transition-colors no-underline text-gray-400">
                  {t("footer.treatments")}
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm hover:text-white transition-colors no-underline text-gray-400">
                  {t("footer.adminPortal")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>{t("footer.hours1")}</li>
              <li>{t("footer.hours2")}</li>
              <li>{t("footer.hours3")}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
