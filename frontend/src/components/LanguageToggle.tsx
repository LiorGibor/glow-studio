import { useTranslation } from "react-i18next";

export default function LanguageToggle({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === "he";

  const toggle = () => {
    i18n.changeLanguage(isHebrew ? "en" : "he");
  };

  const base =
    "px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none";
  const colors =
    variant === "dark"
      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <button onClick={toggle} className={`${base} ${colors}`}>
      {isHebrew ? "EN" : "עב"}
    </button>
  );
}
