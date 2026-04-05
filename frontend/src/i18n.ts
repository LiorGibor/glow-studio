import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import he from "./locales/he.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: "he",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "glow_lang",
      caches: ["localStorage"],
    },
  });

// Apply dir and lang to <html> on language change
const applyDirection = (lng: string) => {
  const dir = lng === "he" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lng);
};

applyDirection(i18n.language);
i18n.on("languageChanged", applyDirection);

export default i18n;
