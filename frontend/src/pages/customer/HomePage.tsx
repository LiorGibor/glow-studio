import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import {
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineArrowRight,
} from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { treatmentService } from "@/lib/services";
import {
  formatPrice,
  formatDuration,
  getPlaceholderImage,
  getCategoryIcon,
  getCategoryGradient,
} from "@/lib/utils";
import type { Treatment } from "@/types";

// ── Animation variants ──────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Skeleton card ───────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
      <div className="h-48 skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-20 rounded skeleton" />
        <div className="h-5 w-3/4 rounded skeleton" />
        <div className="h-4 w-full rounded skeleton" />
        <div className="flex justify-between pt-2">
          <div className="h-4 w-16 rounded skeleton" />
          <div className="h-4 w-16 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}

// ── Treatment card ──────────────────────────────────────────────────────

function TreatmentCard({
  treatment,
  index,
  bookLabel,
}: {
  treatment: Treatment;
  index: number;
  bookLabel: string;
}) {
  const gradient = getCategoryGradient(treatment.category);
  const icon = getCategoryIcon(treatment.category);
  const image = treatment.image_url || getPlaceholderImage(treatment.category);

  return (
    <motion.div
      custom={index}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="group rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100
                 hover:shadow-xl hover:shadow-primary-100/50 transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={treatment.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Category badge */}
        <span
          className={`absolute top-3 start-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                      text-xs font-medium text-white bg-gradient-to-r ${gradient} shadow-sm`}
        >
          <span>{icon}</span>
          {treatment.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-2">
        <h3 className="font-display text-lg font-semibold text-gray-900 leading-tight">
          {treatment.name}
        </h3>

        {treatment.short_description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {treatment.short_description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-2 mt-auto text-sm">
          <span className="flex items-center gap-1 text-gray-600">
            <HiOutlineClock className="w-4 h-4" />
            {formatDuration(treatment.duration_minutes)}
          </span>
          <span className="flex items-center gap-1 font-semibold text-primary-600">
            <HiOutlineCurrencyDollar className="w-4 h-4" />
            {formatPrice(treatment.price)}
          </span>
        </div>

        {/* CTA */}
        <Link
          to={`/book/${treatment.slug}`}
          className="mt-3 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                     bg-primary-500 text-white text-sm font-medium
                     hover:bg-primary-600 active:scale-[0.98] transition-all duration-200"
        >
          {bookLabel}
          <HiOutlineArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Home Page ───────────────────────────────────────────────────────────

export default function HomePage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function load() {
      try {
        const [treatmentData, categoryData] = await Promise.all([
          treatmentService.list(),
          treatmentService.getCategories(),
        ]);
        setTreatments(treatmentData.filter((t) => t.is_active));
        setCategories(categoryData);
      } catch {
        // fail silently — empty state shows
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    activeCategory === "All"
      ? treatments
      : treatments.filter((t) => t.category === activeCategory);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent-100 rounded-full opacity-40 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-6 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {t("hero.badge")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight"
          >
            {t("hero.title1")}{" "}
            <span className="gradient-text">{t("hero.title2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-5 max-w-xl mx-auto text-gray-500 text-lg sm:text-xl"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#treatments"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full
                         bg-primary-500 text-white font-medium text-base
                         shadow-lg shadow-primary-300/40 hover:bg-primary-600
                         active:scale-[0.97] transition-all duration-200"
            >
              {t("hero.cta")}
              <HiOutlineArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── Treatments ──────────────────────────────────────────────── */}
      <section id="treatments" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
            {t("treatments.heading")}
          </h2>
          <p className="mt-3 text-gray-500 text-lg max-w-lg mx-auto">
            {t("treatments.subtitle")}
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${
                  activeCategory === cat
                    ? "bg-primary-500 text-white shadow-md shadow-primary-200/50"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {cat !== "All" && (
                <span className="me-1">{getCategoryIcon(cat)}</span>
              )}
              {cat === "All" ? t("treatments.all") : cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-lg">
            {t("treatments.empty")}
          </p>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((t_item, i) => (
              <TreatmentCard key={t_item.id} treatment={t_item} index={i} bookLabel={t("treatments.bookNow")} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
